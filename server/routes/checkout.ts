import { Router } from "express";
import { supabase, encrypt } from "../lib/supabase.js";
import { callOrbiPayGateway, getPayServiceKey } from "../lib/orbiPayGateway.js";

const router = Router();

function parseWholesaleTiersFromText(description: string = ""): any[] {
  const result: any[] = [];
  if (!description) return result;
  const lines = description.split("\n").map(l => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const current = lines[i];
    const priceMatch = current.match(/(?:TSh|sh|tzs|usd)?\s*([0-9,.]+)/i);
    if (priceMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const rangeMatch = nextLine.match(/([0-9,]+)\s*-\s*([0-9,]+)\s*(?:pcs|pieces|vipande)?/i);
      const limitMatch = nextLine.match(/(?:≥|>=|\+)?\s*([0-9,]+)\s*(?:pcs|pieces|vipande)?\s*(?:pieces|vipande|\+)?/i);
      const rawPriceStr = priceMatch[1].replace(/,/g, "");
      const parsedPrice = parseFloat(rawPriceStr);
      if (!isNaN(parsedPrice) && parsedPrice > 100 && !current.includes("-") && !current.includes("/")) {
        if (rangeMatch) {
          const minQty = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
          const maxQty = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
          result.push({ minQty, maxQty, price: parsedPrice });
          i += 2;
          continue;
        } else if (nextLine.includes("≥") || nextLine.includes("+") || nextLine.includes("pieces") || nextLine.includes("pcs") || limitMatch) {
          const singleNumMatch = nextLine.match(/([0-9,]+)/);
          if (singleNumMatch) {
            const minQty = parseInt(singleNumMatch[1].replace(/,/g, ""), 10);
            result.push({ minQty, price: parsedPrice });
            i += 2;
            continue;
          }
        }
      }
    }
    i++;
  }
  return result;
}

function getProductPriceForQty(product: any, qty: number): number {
  if (!product) return 0;
  const price = parseFloat(product.price) || 0;
  const tiers = (product.wholesaleTiers && product.wholesaleTiers.length > 0)
    ? product.wholesaleTiers
    : parseWholesaleTiersFromText(product.description || "");

  if (tiers && tiers.length > 0) {
    const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return parseFloat(tier.price) || price;
      }
    }
  }
  return price;
}

const isValidUUID = (id: any): boolean => {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

router.post("/", async (req, res) => {
  try {
    const { cart, user, paymentMethod, paymentCategory, paymentRail, paymentAccount, operation, appliedCoupon, finalTotal, name, phone, address, options, tin, lang } = req.body;

    // Gateway contract validation
    if (!paymentCategory || !paymentRail || !operation) {
      return res.status(400).json({ success: false, error: "Gateway Error: Missing paymentCategory, paymentRail, or operation. Every request must declare these fields." });
    }

    if (operation !== "paysafe") {
      return res.status(400).json({ success: false, error: "Gateway Error: Only 'paysafe' operation is supported for this checkout." });
    }

    let gatewayStatus = "pending";
    let gatewayMessage = "Processing transaction...";

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty." });
    }

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, error: "Name, phone, and address are required fields." });
    }

    const stockCheckPromises = cart.map(async (c: any) => {
      const prodId = c.product?.id;
      let query = supabase.from("products").select("id, stock, name");
      if (isValidUUID(prodId)) {
        query = query.eq("id", prodId);
      } else {
        query = query.eq("legacy_id", prodId);
      }
      const { data: p } = await query.maybeSingle();
      if (!p) throw new Error(`Product "${c.product?.name || 'product'}" not found.`);
      if (p.stock < c.quantity) throw new Error(`Insufficient stock for ${p.name}.`);
      return { ...c, dbProductId: p.id, currentStock: p.stock };
    });
    const validatedCart = await Promise.all(stockCheckPromises);

    const oIdBase = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    const methodObj = options?.find((po: any) => po.id === paymentMethod);

    const sellerGroups: { [key: string]: any[] } = {};
    validatedCart.forEach((c: any) => {
      const sellerId = c.product.sellerId || "system";
      if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
      sellerGroups[sellerId].push(c);
    });

    const oIds: string[] = [];
    const successfulOrders: any[] = [];
    
    // Resolve valid customer ID from public.customers to avoid FK constraint violation
    let dbCustomerId: string | null = null;
    if (user?.id && isValidUUID(user.id)) {
      const { data: custExists } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (custExists) {
        dbCustomerId = user.id;
      }
    }
    
    for (const sellerId in sellerGroups) {
      const sellerItems = sellerGroups[sellerId];
      const sellerTotal = sellerItems.reduce((sum: number, item: any) => {
        const actualPrice = getProductPriceForQty(item.product, item.quantity);
        return sum + actualPrice * (parseInt(item.quantity, 10) || 1);
      }, 0);
      const oId = `${oIdBase}-${sellerId}`;
      
      // Construct the normalized payment intent as required by Gateway
      const paymentIntent = {
        serviceCode: "orbi-shop",
        operation: operation, // Validated to be 'paysafe'
        reference: oId,
        amount: sellerTotal,
        currency: "TZS",
        paymentCategory: paymentCategory,
        paymentRail: paymentRail,
        customer: {
          type: dbCustomerId ? "user" : "external_customer",
          orbiUserId: dbCustomerId,
          name: name,
          phone: phone
        },
        merchant: {
          merchantId: sellerId,
          settlementAccount: "paysafe"
        },
        metadata: {
          orderId: oId,
          checkoutMode: "secure_escrow"
        }
      };

      const serviceKey = getPayServiceKey();
      if (serviceKey) {
        try {
          const result = await callOrbiPayGateway("/v1/paysafe/escrows", {
            method: "POST",
            body: {
              reference: String(oId),
              amount: Number(sellerTotal),
              currency: "TZS",
              confirm: true,
              description: "ORBI Shop protected checkout",
              buyer: {
                userId: dbCustomerId,
                name: name,
                phone: phone,
                email: user?.email || ""
              },
              seller: {
                userId: sellerId,
                walletId: "paysafe"
              },
              metadata: paymentIntent.metadata
            }
          });
          console.log(`[PAYSAFE_GATEWAY] Live Escrow Created for ${oId} ->`, result);
          if (result && result.status) {
            gatewayStatus = (result.status === 'held' || result.status === 'completed') ? 'success' : result.status;
            gatewayMessage = result.message || "Payment processed via live Orbi Pay Gateway.";
          }
        } catch (e: any) {
          console.error(`[PAYSAFE_GATEWAY] Live Orbi Pay Error for ${oId}:`, e.message);
          // If the gateway hard fails, we must abort the transaction safely
          return res.status(e.status || 400).json({ success: false, error: e.message || "Payment Gateway failed to process transaction." });
        }
      } else {
        console.error("[PAYSAFE_GATEWAY] ORBI_SHOP_PAY_API_KEY is not configured in the environment.");
        return res.status(500).json({ success: false, error: "Payment Gateway configuration error. Please contact support." });
      }

      const { data: oRow, error: oError } = await supabase
        .from("orders")
        .insert([{
          legacy_id: oId,
          customer_name: encrypt(name),
          customer_phone: encrypt(phone),
          customer_address: encrypt(address),
          customer_tin: tin ? encrypt(tin) : null,
          customer_id: dbCustomerId,
          payment_method: paymentRail,
          payment_method_name: paymentCategory,
          total: sellerTotal,
          status: "pending",
          payment_reference: encrypt(`ESCROW:HELD:${paymentRail}||`) // Ensures money is marked as held safely initially
        }])
        .select("id")
        .single();

      if (oError || !oRow) throw new Error(oError?.message || "Failed to insert order");
      oIds.push(oId);

      await supabase.from("order_items").insert(
        sellerItems.map((c: any) => ({
          order_id: oRow.id,
          product_id: c.dbProductId,
          name: c.product.name,
          price: getProductPriceForQty(c.product, c.quantity),
          quantity: parseInt(c.quantity, 10) || 1,
        }))
      );

      const stockUpdatePromises = sellerItems.map((c: any) => {
        const newStock = Math.max(0, c.currentStock - (parseInt(c.quantity, 10) || 1));
        return supabase.from("products").update({ stock: newStock }).eq("id", c.dbProductId);
      });
      await Promise.all(stockUpdatePromises);
      successfulOrders.push({ oId, orderRowId: oRow.id, sellerId, sellerTotal, sellerItems });
    }

    // Fire-and-forget notifications
    setTimeout(async () => {
      try {
        const { sendOrbiTalkTemplate } = await import("./talk.js");
        for (const orderData of successfulOrders) {
           // Simplified notification logic
           await sendOrbiTalkTemplate({
             templateName: "SHOP_ORDER_CREATED",
             recipient: phone,
             channel: "sms",
             language: "sw",
             requestId: `customer-checkout-sms-${orderData.oId}`,
             data: { customerName: name, orderId: orderData.oId, currency: "TZS", amount: String(orderData.sellerTotal) }
           }).catch(() => {});
        }
      } catch (e) {}
    }, 0);

    res.json({ 
      success: true, 
      baseOrderId: oIdBase, 
      successfulOrders: oIds,
      gatewayResponse: {
        status: gatewayStatus,
        message: gatewayMessage
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;

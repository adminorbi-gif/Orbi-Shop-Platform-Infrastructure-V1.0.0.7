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

type GatewayPaymentCategory = "orbi" | "mobile_money" | "bank" | "card";
type GatewayPaymentRail = "orbi_wallet" | "mno_tz" | "bank_transfer_tz" | "card_gateway";
type ShopPaymentOutcome = "held" | "requires_action" | "processing" | "failed";

const routeByMethod: Record<string, { paymentCategory: GatewayPaymentCategory; paymentRail: GatewayPaymentRail; providerCode?: string }> = {
  orbi_wallet: { paymentCategory: "orbi", paymentRail: "orbi_wallet" },
  mno_tz: { paymentCategory: "mobile_money", paymentRail: "mno_tz", providerCode: "orbi_shop_mno_tz" },
  tz_bank: { paymentCategory: "card", paymentRail: "card_gateway", providerCode: "orbi_shop_card_gateway" },
  card_gateway: { paymentCategory: "card", paymentRail: "card_gateway", providerCode: "orbi_shop_card_gateway" },
  bank_transfer_tz: { paymentCategory: "bank", paymentRail: "bank_transfer_tz", providerCode: "orbi_shop_bank_transfer_tz" },
};

const categoryForRail: Record<GatewayPaymentRail, GatewayPaymentCategory> = {
  orbi_wallet: "orbi",
  mno_tz: "mobile_money",
  bank_transfer_tz: "bank",
  card_gateway: "card",
};

function normalizeGatewayPaySafeRoute(input: {
  paymentMethod?: string;
  paymentCategory?: string;
  paymentRail?: string;
  providerCode?: string;
  paymentAccount?: string;
}) {
  const methodRoute = routeByMethod[String(input.paymentMethod || "").trim().toLowerCase()];
  const paymentCategory = String(input.paymentCategory || methodRoute?.paymentCategory || "").trim().toLowerCase();
  const paymentRail = String(input.paymentRail || methodRoute?.paymentRail || "").trim().toLowerCase();
  const providerCode = String(input.providerCode || methodRoute?.providerCode || "").trim();

  if (!paymentCategory || !paymentRail) {
    throw new Error("Gateway Error: Missing paymentCategory or paymentRail. Every PaySafe request must declare a funding route.");
  }

  if (!["orbi", "mobile_money", "bank", "card"].includes(paymentCategory)) {
    throw new Error(`Gateway Error: Unsupported paymentCategory '${paymentCategory}'.`);
  }

  if (!["orbi_wallet", "mno_tz", "bank_transfer_tz", "card_gateway"].includes(paymentRail)) {
    throw new Error(`Gateway Error: Unsupported paymentRail '${paymentRail}'.`);
  }

  if (categoryForRail[paymentRail as GatewayPaymentRail] !== paymentCategory) {
    throw new Error("Gateway Error: paymentCategory and paymentRail do not match.");
  }

  if (paymentCategory !== "orbi" && !providerCode) {
    throw new Error("Gateway Error: External PaySafe rails require providerCode.");
  }

  return {
    paymentCategory: paymentCategory as GatewayPaymentCategory,
    paymentRail: paymentRail as GatewayPaymentRail,
    providerCode: providerCode || undefined,
    paymentAccount: String(input.paymentAccount || "").trim(),
  };
}

function normalizeGatewayOutcome(result: any, fallbackReference: string, route: ReturnType<typeof normalizeGatewayPaySafeRoute>) {
  const intent = result?.data || result?.paymentIntent || result?.intent || {};
  const coreData = result?.core?.data || result?.core || intent?.coreResult || {};
  const rawStatus = String(coreData?.status || intent?.status || result?.status || "processing").trim().toLowerCase();
  const failed = result?.success === false || ["failed", "declined", "cancelled", "rejected"].includes(rawStatus);
  const held = ["held", "completed", "settled", "authorized", "payment_held"].includes(rawStatus);
  const requiresAction = ["requires_action", "challenge_required", "requires_confirmation"].includes(rawStatus);
  const status: ShopPaymentOutcome = failed ? "failed" : held ? "held" : requiresAction ? "requires_action" : "processing";

  const defaultMessage: Record<ShopPaymentOutcome, string> = {
    held: "Payment accepted and funds are protected in ORBI PaySafe.",
    requires_action: "Customer authorization is required before ORBI Core can complete the hold.",
    processing: "Payment request accepted. ORBI PaySafe is processing the funding route.",
    failed: "Payment was declined or could not be completed.",
  };

  return {
    status,
    rawStatus,
    message: String(coreData?.message || intent?.coreResult?.message || result?.message || defaultMessage[status]),
    paymentIntentId: intent?.id || coreData?.intentId || null,
    reference: intent?.reference || coreData?.reference || fallbackReference,
    transactionId: coreData?.transactionId || intent?.coreResult?.transactionId || null,
    challenge: coreData?.challenge || intent?.coreResult?.challenge || null,
    paymentCategory: route.paymentCategory,
    paymentRail: route.paymentRail,
    providerCode: route.providerCode || null,
  };
}

function mapOrderStateFromGateway(outcome: ReturnType<typeof normalizeGatewayOutcome>) {
  if (outcome.status === "held") {
    return {
      dbStatus: "confirmed",
      paymentReference: `ESCROW:PAYMENT_HELD:held||${outcome.transactionId || outcome.paymentIntentId || outcome.reference}`,
    };
  }

  if (outcome.status === "failed") {
    return {
      dbStatus: "cancelled",
      paymentReference: `ESCROW:PAYMENT_FAILED:${outcome.rawStatus}||${outcome.paymentIntentId || outcome.reference}`,
    };
  }

  return {
    dbStatus: "pending",
    paymentReference: `ESCROW:${outcome.status.toUpperCase()}:${outcome.rawStatus}||${outcome.paymentIntentId || outcome.reference}`,
  };
}

router.post("/", async (req, res) => {
  try {
    const { cart, user, paymentMethod, paymentCategory, paymentRail, providerCode, paymentAccount, operation, appliedCoupon, finalTotal, name, phone, address, options, tin, lang } = req.body;

    // Gateway contract validation
    if (!paymentCategory || !paymentRail || !operation) {
      return res.status(400).json({ success: false, error: "Gateway Error: Missing paymentCategory, paymentRail, or operation. Every request must declare these fields." });
    }

    if (operation !== "paysafe") {
      return res.status(400).json({ success: false, error: "Gateway Error: Only 'paysafe' operation is supported for this checkout." });
    }

    const paymentRoute = normalizeGatewayPaySafeRoute({
      paymentMethod,
      paymentCategory,
      paymentRail,
      providerCode,
      paymentAccount,
    });

    const gatewayResults: ReturnType<typeof normalizeGatewayOutcome>[] = [];

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
        paymentCategory: paymentRoute.paymentCategory,
        paymentRail: paymentRoute.paymentRail,
        providerCode: paymentRoute.providerCode,
        customer: {
          type: dbCustomerId ? "user" : "external_customer",
          userId: dbCustomerId,
          name: name,
          phone: phone
        },
        merchant: {
          merchantId: sellerId,
          settlementAccount: "paysafe"
        },
        metadata: {
          orderId: oId,
          checkoutMode: "secure_escrow",
          paymentCategory: paymentRoute.paymentCategory,
          paymentRail: paymentRoute.paymentRail,
          providerCode: paymentRoute.providerCode,
          paymentAccountHint: paymentRoute.paymentAccount ? `${paymentRoute.paymentAccount.slice(0, 3)}***${paymentRoute.paymentAccount.slice(-3)}` : undefined,
          settlementPolicy: "paysafe_hold_required"
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
              paymentCategory: paymentIntent.paymentCategory,
              paymentRail: paymentIntent.paymentRail,
              providerCode: paymentIntent.providerCode,
              confirm: true,
              description: "ORBI Shop protected checkout",
              buyer: {
                type: dbCustomerId ? "user" : "external_customer",
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
          gatewayResults.push(normalizeGatewayOutcome(result, oId, paymentRoute));
        } catch (e: any) {
          console.error(`[PAYSAFE_GATEWAY] Live Orbi Pay Error for ${oId}:`, e.message);
          // If the gateway hard fails, we must abort the transaction safely
          return res.status(e.status || 400).json({ success: false, error: e.message || "Payment Gateway failed to process transaction." });
        }
      } else {
        console.error("[PAYSAFE_GATEWAY] ORBI_SHOP_PAY_API_KEY is not configured in the environment.");
        return res.status(500).json({ success: false, error: "Payment Gateway configuration error. Please contact support." });
      }

      const gatewayOutcome = gatewayResults[gatewayResults.length - 1] || normalizeGatewayOutcome(null, oId, paymentRoute);
      const orderState = mapOrderStateFromGateway(gatewayOutcome);

      const { data: oRow, error: oError } = await supabase
        .from("orders")
        .insert([{
          legacy_id: oId,
          customer_name: encrypt(name),
          customer_phone: encrypt(phone),
          customer_address: encrypt(address),
          customer_tin: tin ? encrypt(tin) : null,
          customer_id: dbCustomerId,
          payment_method: paymentRoute.paymentRail,
          payment_method_name: paymentRoute.paymentCategory,
          total: sellerTotal,
          status: orderState.dbStatus,
          payment_reference: encrypt(orderState.paymentReference)
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
      gatewayResponse: gatewayResults.length === 1 ? gatewayResults[0] : {
        status: gatewayResults.every((item) => item.status === "held") ? "held" : gatewayResults.some((item) => item.status === "failed") ? "failed" : "processing",
        rawStatus: "multi_seller_checkout",
        message: "Checkout was routed across multiple seller PaySafe holds. Review each order reference below.",
        reference: oIdBase,
        paymentCategory: paymentRoute.paymentCategory,
        paymentRail: paymentRoute.paymentRail,
        providerCode: paymentRoute.providerCode || null,
      },
      gatewayResults
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;

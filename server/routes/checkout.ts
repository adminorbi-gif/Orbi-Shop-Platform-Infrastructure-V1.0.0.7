import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { encrypt } from "../lib/supabase.js";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

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
  const tiers = (product.wholesaleTiers && product.wholesaleTiers.length > 0)
    ? product.wholesaleTiers
    : parseWholesaleTiersFromText(product.description || "");

  if (tiers && tiers.length > 0) {
    const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.price;
      }
    }
  }
  return product.price;
}

router.post("/", async (req, res) => {
  try {
    const { cart, user, paymentMethod, appliedCoupon, finalTotal, name, phone, address, options, tin, lang } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty." });
    }

    const stockCheckPromises = cart.map(async (c: any) => {
      const { data: p } = await supabase.from("products").select("stock, name").eq("id", c.product.id).single();
      if (!p) throw new Error(`Product not found.`);
      if (p.stock < c.quantity) throw new Error(`Insufficient stock for ${p.name}.`);
      return { ...c, currentStock: p.stock };
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
    
    for (const sellerId in sellerGroups) {
      const sellerItems = sellerGroups[sellerId];
      const sellerTotal = sellerItems.reduce((sum: number, item: any) => {
        const actualPrice = getProductPriceForQty(item.product, item.quantity);
        return sum + actualPrice * item.quantity;
      }, 0);
      const oId = `${oIdBase}-${sellerId}`;
      
      const { data: oRow, error: oError } = await supabase
        .from("orders")
        .insert([{
          legacy_id: oId,
          customer_name: encrypt(name),
          customer_phone: encrypt(phone),
          customer_address: encrypt(address),
          customer_tin: tin ? encrypt(tin) : null,
          customer_id: user?.id || null,
          payment_method: paymentMethod,
          payment_method_name: methodObj ? methodObj.name : paymentMethod,
          total: sellerTotal,
          status: "pending",
          payment_reference: encrypt("ESCROW:CREATED:requires_action||")
        }])
        .select("id")
        .single();

      if (oError || !oRow) throw new Error(oError?.message || "Failed to insert order");
      oIds.push(oId);

      await supabase.from("order_items").insert(
        sellerItems.map((c: any) => ({
          order_id: oRow.id,
          product_id: c.product.id,
          name: c.product.name,
          price: getProductPriceForQty(c.product, c.quantity),
          quantity: c.quantity,
        }))
      );

      const stockUpdatePromises = sellerItems.map((c: any) => {
        const newStock = Math.max(0, c.currentStock - c.quantity);
        return supabase.from("products").update({ stock: newStock }).eq("id", c.product.id);
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

    res.json({ success: true, baseOrderId: oIdBase, successfulOrders: oIds });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;

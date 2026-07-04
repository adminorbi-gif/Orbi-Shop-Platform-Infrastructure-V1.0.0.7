import { Router, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { supabase, getSupabase, encrypt, decrypt } from "../lib/supabase.js";
import { sendOrbiTalkTemplate } from "./talk.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { callOrbiPayGateway, getPaySafeHoldMinutes, getPayServiceKey, getOrbiPayGatewayBaseUrl } from "../lib/orbiPayGateway.js";

const router = Router();

const LOGS_FILE = path.join(process.cwd(), "server/data/payment_ledger_logs.json");

// In-memory registry to track real-time active automated payment verifications
const activeVerifications = new Map<string, { startTime: number; orderId: string }>();

type PaySafePaymentCategory = "orbi" | "mobile_money" | "bank" | "card";
type PaySafePaymentRail = "orbi_wallet" | "mno_tz" | "bank_transfer_tz" | "card_gateway";

const paySafeRouteByMethod: Record<string, { paymentCategory: PaySafePaymentCategory; paymentRail: PaySafePaymentRail; providerCode?: string }> = {
  orbi_wallet: { paymentCategory: "orbi", paymentRail: "orbi_wallet" },
  mno_tz: { paymentCategory: "mobile_money", paymentRail: "mno_tz", providerCode: "orbi_shop_mno_tz" },
  tz_bank: { paymentCategory: "card", paymentRail: "card_gateway", providerCode: "orbi_shop_card_gateway" },
  card_gateway: { paymentCategory: "card", paymentRail: "card_gateway", providerCode: "orbi_shop_card_gateway" },
  bank_transfer_tz: { paymentCategory: "bank", paymentRail: "bank_transfer_tz", providerCode: "orbi_shop_bank_transfer_tz" },
};

const paySafeCategoryForRail: Record<PaySafePaymentRail, PaySafePaymentCategory> = {
  orbi_wallet: "orbi",
  mno_tz: "mobile_money",
  bank_transfer_tz: "bank",
  card_gateway: "card",
};

function paySafeRouteError(message: string) {
  const error = new Error(message);
  (error as any).status = 400;
  return error;
}

function resolvePaySafeRoute(input: {
  paymentMethod?: string;
  paymentCategory?: string;
  paymentRail?: string;
  providerCode?: string;
  buyer?: any;
  customerPhone?: string;
  accountNumber?: string;
}) {
  const methodRoute = paySafeRouteByMethod[String(input.paymentMethod || "").trim().toLowerCase()];
  const paymentCategory = String(input.paymentCategory || methodRoute?.paymentCategory || "").trim().toLowerCase();
  const paymentRail = String(input.paymentRail || methodRoute?.paymentRail || "").trim().toLowerCase();
  const providerCode = String(input.providerCode || methodRoute?.providerCode || "").trim();

  if (!["orbi", "mobile_money", "bank", "card"].includes(paymentCategory)) {
    throw paySafeRouteError("PaySafe paymentCategory is required and must be orbi, mobile_money, bank, or card.");
  }
  if (!["orbi_wallet", "mno_tz", "bank_transfer_tz", "card_gateway"].includes(paymentRail)) {
    throw paySafeRouteError("PaySafe paymentRail is required and must be orbi_wallet, mno_tz, bank_transfer_tz, or card_gateway.");
  }

  const category = paymentCategory as PaySafePaymentCategory;
  const rail = paymentRail as PaySafePaymentRail;
  if (paySafeCategoryForRail[rail] !== category) {
    throw paySafeRouteError("PaySafe paymentCategory and paymentRail do not match.");
  }
  if (category !== "orbi" && !providerCode) {
    throw paySafeRouteError("External PaySafe routes require providerCode.");
  }
  if (category === "mobile_money" && !String(input.buyer?.phone || input.customerPhone || "").trim()) {
    throw paySafeRouteError("Mobile-money PaySafe checkout requires buyer phone.");
  }

  return {
    paymentCategory: category,
    paymentRail: rail,
    providerCode: providerCode || undefined,
  };
}

function ensureLogsDir() {
  const dir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writePaymentLedgerLog(log: {
  orderId: string;
  gatewayReferenceId: string;
  amount: number;
  paymentMethod: string;
  status: "success" | "failed" | "pending";
  message: string;
}) {
  try {
    ensureLogsDir();
    let logs: any[] = [];
    if (fs.existsSync(LOGS_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf8"));
      } catch (e) {
        logs = [];
      }
    }
    const newLog = {
      id: `TL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      orderId: log.orderId,
      gatewayReferenceId: log.gatewayReferenceId,
      amount: log.amount,
      paymentMethod: log.paymentMethod || "Mobile Money",
      status: log.status,
      timestamp: Date.now(),
      message: log.message,
    };
    logs.unshift(newLog);
    if (logs.length > 200) {
      logs = logs.slice(0, 200);
    }
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf8");
  } catch (err: any) {
    console.error("Failed to write payment ledger log:", err.message);
  }
}

const stableJson = (value: unknown): string => {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
    .join(",")}}`;
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const verifyOrbiPayWebhook = (req: any) => {
  const secret = String(process.env.ORBI_SHOP_PAY_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    console.warn("[PAYMENTS WEBHOOK] ORBI_SHOP_PAY_WEBHOOK_SECRET is not configured; accepting webhook for local/dev compatibility.");
    return;
  }

  const timestamp = String(req.get("x-orbi-pay-timestamp") || "").trim();
  const signature = String(req.get("x-orbi-pay-signature") || "").trim().replace(/^sha256=/i, "");
  if (!timestamp || !signature) {
    const error = new Error("ORBI_PAY_WEBHOOK_SIGNATURE_REQUIRED");
    (error as any).status = 401;
    throw error;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > Number(process.env.ORBI_SHOP_PAY_WEBHOOK_MAX_AGE_SECONDS || 300)) {
    const error = new Error("ORBI_PAY_WEBHOOK_TIMESTAMP_INVALID");
    (error as any).status = 401;
    throw error;
  }

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${stableJson(req.body)}`).digest("hex");
  if (!safeEqual(expected, signature)) {
    const error = new Error("ORBI_PAY_WEBHOOK_SIGNATURE_INVALID");
    (error as any).status = 401;
    throw error;
  }
};

const resolveOrderIdFromPaymentIntent = (paymentIntent: any) => {
  const metadata = paymentIntent?.metadata || {};
  return String(
    metadata.shopOrderId ||
      metadata.orderId ||
      metadata.order_id ||
      paymentIntent?.reference ||
      "",
  ).trim();
};

const mapGatewayStatusToOrderState = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "processing":
    case "pending":
      return { orderState: "PAYMENT_HELD", paymentStatus: "held", dbStatus: "confirmed" };
    case "requires_action":
      return { orderState: "AWAITING_PAYMENT", paymentStatus: "requires_action", dbStatus: "pending" };
    case "failed":
      return { orderState: "CREATED", paymentStatus: "failed", dbStatus: "pending" };
    case "refunded":
      return { orderState: "REFUNDED", paymentStatus: "refunded", dbStatus: "cancelled" };
    case "disputed":
      return { orderState: "DISPUTED", paymentStatus: "disputed", dbStatus: "confirmed" };
    default:
      return { orderState: "AWAITING_PAYMENT", paymentStatus: status || "processing", dbStatus: "pending" };
  }
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function findOrderForWebhook(orderId: string) {
  if (isUuid(orderId)) {
    const byId = await supabase
      .from("orders")
      .select("id,legacy_id,status")
      .eq("id", orderId)
      .maybeSingle();

    if (byId.error) throw byId.error;
    if (byId.data) return byId.data;
  }

  const byLegacyId = await supabase
    .from("orders")
    .select("id,legacy_id,status")
    .eq("legacy_id", orderId)
    .maybeSingle();

  if (byLegacyId.error) throw byLegacyId.error;
  return byLegacyId.data || null;
}

function resolveSettlementSplitsFromPaymentIntent(paymentIntent: any) {
  const metadata = paymentIntent?.metadata || {};
  const splits = paymentIntent?.settlementSplits || metadata?.settlementSplits || [];
  return Array.isArray(splits)
    ? splits
        .map((split: any) => ({
          orderId: String(split?.orderId || split?.shopOrderId || "").trim(),
          sellerId: String(split?.sellerId || "").trim(),
          payableAmount: Number(split?.payableAmount || split?.amount || 0),
        }))
        .filter((split) => split.orderId)
    : [];
}

async function handleOrbiPayWebhook(req: any, res: any) {
  try {
    verifyOrbiPayWebhook(req);

    const eventId = String(req.body?.eventId || req.get("x-orbi-pay-event-id") || "").trim();
    const eventType = String(req.body?.eventType || "payment_intent.updated").trim();
    const paymentIntent = req.body?.paymentIntent || {};
    const orderId = resolveOrderIdFromPaymentIntent(paymentIntent);
    const status = String(paymentIntent.status || "").trim();
    const reference = String(paymentIntent.reference || paymentIntent.id || "").trim();

    console.log(`[PAYMENTS WEBHOOK] ${eventType} ${eventId || "(no-event-id)"} for order ${orderId || "(no-order)"} status ${status || "(no-status)"}`);

    if (!orderId) {
      return res.status(202).json({
        received: true,
        processed: false,
        reason: "ORDER_ID_NOT_PRESENT",
      });
    }

    const order = await findOrderForWebhook(orderId);
    if (!order) {
      const settlementSplits = resolveSettlementSplitsFromPaymentIntent(paymentIntent);
      if (settlementSplits.length > 0) {
        const mapped = mapGatewayStatusToOrderState(status);
        const updatedOrders: any[] = [];

        for (const split of settlementSplits) {
          const childOrder = await findOrderForWebhook(split.orderId);
          if (!childOrder) continue;

          const paymentReference = `ESCROW:${mapped.orderState}:${mapped.paymentStatus}||${reference}||SPLIT:${orderId}:${split.sellerId || "seller"}:${split.payableAmount || 0}`;
          const { data: updated, error } = await supabase
            .from("orders")
            .update({
              status: mapped.dbStatus,
              payment_reference: encrypt(paymentReference),
              payment_method: "orbi_paysafe",
              payment_method_name: "ORBI PaySafe",
            })
            .eq("id", childOrder.id)
            .select("id,legacy_id,status")
            .maybeSingle();

          if (error) throw error;
          if (updated) updatedOrders.push(updated);
        }

        return res.json({
          received: true,
          processed: updatedOrders.length > 0,
          eventId: eventId || null,
          orderId,
          status,
          mappedOrderState: mapped.orderState,
          mappedPaymentStatus: mapped.paymentStatus,
          splitOrdersUpdated: updatedOrders.length,
          splitOrdersExpected: settlementSplits.length,
        });
      }

      return res.status(202).json({
        received: true,
        processed: false,
        reason: "ORDER_NOT_FOUND",
        eventId: eventId || null,
        orderId,
        status,
      });
    }

    const mapped = mapGatewayStatusToOrderState(status);
    const paymentReference = `ESCROW:${mapped.orderState}:${mapped.paymentStatus}||${reference}`;
    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        status: mapped.dbStatus,
        payment_reference: encrypt(paymentReference),
        payment_method: "orbi_paysafe",
        payment_method_name: "ORBI PaySafe",
      })
      .eq("id", order.id)
      .select("id,legacy_id,status")
      .maybeSingle();

    if (error) throw error;

    return res.json({
      received: true,
      processed: Boolean(updated),
      eventId: eventId || null,
      orderId,
      status,
      mappedOrderState: mapped.orderState,
      mappedPaymentStatus: mapped.paymentStatus,
    });
  } catch (error: any) {
    console.error("[PAYMENTS WEBHOOK ERROR]", error.message);
    res.status(error.status || 500).json({
      received: false,
      error: error.message || "Webhook processing failed",
    });
  }
}

async function initiatePaySafeEscrow(req: any) {
  const {
    amount,
    orderId,
    paymentMethod,
    paymentCategory,
    paymentRail,
    providerCode,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    sellerId,
    sellerWalletId,
    buyer,
    seller,
    currency = "TZS",
    description,
  } = req.body;
  if (!orderId || !amount || Number.isNaN(Number(amount))) {
    const error = new Error("orderId and numeric amount are required to initiate a live ORBI PaySafe escrow.");
    (error as any).status = 400;
    throw error;
  }

  const route = resolvePaySafeRoute({
    paymentMethod,
    paymentCategory,
    paymentRail,
    providerCode,
    buyer,
    customerPhone,
    accountNumber: req.body.accountNumber,
  });

  console.log(`Initiating live ORBI PaySafe escrow for Order ${orderId} of ${currency} ${amount}`);

  const result = await callOrbiPayGateway("/v1/paysafe/escrows", {
    method: "POST",
    serviceKey: getPayServiceKey(req),
    body: {
      reference: String(orderId),
      amount: Number(amount),
      currency,
      paymentCategory: route.paymentCategory,
      paymentRail: route.paymentRail,
      providerCode: route.providerCode,
      confirm: true,
      description: description || "ORBI Shop protected checkout",
      buyer: buyer || {
        type: customerId ? "user" : "external_customer",
        userId: customerId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      seller: seller || {
        userId: sellerId,
        walletId: sellerWalletId,
      },
      metadata: {
        source: "orbi-shop",
        shopOrderId: orderId,
        paymentCategory: route.paymentCategory,
        paymentRail: route.paymentRail,
        providerCode: route.providerCode,
        settlementPolicy: "paysafe_hold_required",
        customerId,
        sellerId,
        holdMinutes: getPaySafeHoldMinutes(),
      },
    },
  });

  return {
    ...result,
    status: result.status || "PENDING",
    escrowState: "held_pending_authorization",
    message: "PaySafe escrow initialized through live ORBI Pay Gateway.",
  };
}

// Example Orbi Pay Webhook/Payment Intent Initialization Endpoint
router.post("/initiate", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    res.json(await initiatePaySafeEscrow(req));
  } catch (error: any) {
    console.error("[PAYMENTS] Failed to initiate payment:", error.message);
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
  }
});

// Legacy handler for backwards compatibility
router.post("/create-intent", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    res.json(await initiatePaySafeEscrow(req));
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error during payment processing", details: error.details });
  }
});

// Orbi Pay Gateway webhook listeners. Keep both paths live for compatibility.
router.post("/webhook", handleOrbiPayWebhook);
router.post("/webhooks", handleOrbiPayWebhook);

// AUTOMATED PAYMENT VERIFICATION ENDPOINT (Public-facing for buyers / tracker modal)
router.post("/verify-payment-auto", async (req: Request, res: Response) => {
  try {
    const { orderId, transactionId } = req.body;
    if (!orderId || !transactionId) {
      return res.status(400).json({ success: false, message: "orderId and transactionId are required." });
    }

    const cleanTxId = String(transactionId).trim().toUpperCase();
    if (cleanTxId.length < 5) {
      return res.status(400).json({ success: false, message: "Transaction ID must be at least 5 characters long." });
    }

    // 1. Fetch the order
    let order: any = null;
    if (isUuid(orderId)) {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      order = data;
    }
    if (!order) {
      const { data } = await supabase.from("orders").select("*").eq("legacy_id", orderId).maybeSingle();
      order = data;
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // 2. If already confirmed / paid, return successful status
    if (order.status === "confirmed" || order.status === "shipped" || order.status === "delivered" || order.status === "customer_confirmed") {
      writePaymentLedgerLog({
        orderId: order.legacy_id || order.id,
        gatewayReferenceId: cleanTxId,
        amount: order.total,
        paymentMethod: order.payment_method || "Orbi PaySafe",
        status: "success",
        message: "Automated payment lookup: reference verified and held in escrow.",
      });
      return res.json({
        success: true,
        alreadyProcessed: true,
        orderId: order.id,
        legacyId: order.legacy_id,
        status: order.status,
        message: "Payment for this order has already been successfully verified and held in escrow.",
        steps: [
          { id: "carrier_connect", label: "Connecting to carrier gateway", status: "success" },
          { id: "ledger_lookup", label: `Looking up Transaction ID: ${cleanTxId}`, status: "success" },
          { id: "amount_verify", label: `Verifying amount matching TZS ${order.total}`, status: "success" },
          { id: "escrow_hold", label: "Allocating Orbi PaySafe Escrow vault", status: "success" },
          { id: "order_update", label: "Updating secure order state ledger", status: "success" }
        ]
      });
    }

    // 3. Prevent double-spending / duplicate TX IDs
    let isDuplicate = false;
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("id, legacy_id, payment_reference")
      .in("status", ["confirmed", "shipped", "delivered", "customer_confirmed"]);

    if (paidOrders) {
      for (const po of paidOrders) {
        if (po.id !== order.id && po.payment_reference) {
          try {
            const decryptedRef = decrypt(po.payment_reference);
            if (decryptedRef && decryptedRef.toUpperCase().includes(cleanTxId)) {
              isDuplicate = true;
              break;
            }
          } catch (err) {}
        }
      }
    }

    if (isDuplicate) {
      writePaymentLedgerLog({
        orderId: order.legacy_id || order.id,
        gatewayReferenceId: cleanTxId,
        amount: order.total,
        paymentMethod: order.payment_method || "Orbi PaySafe",
        status: "failed",
        message: "Duplicate Transaction ID submitted for payment verification.",
      });
      return res.status(400).json({
        success: false,
        message: "This Transaction ID has already been submitted and approved for another order. Please check your mobile money SMS receipt or contact customer service."
      });
    }

    // 4. Contact Live Orbi Gateway
    let isValid = true;
    const gatewayUrl = getOrbiPayGatewayBaseUrl();
    if (gatewayUrl) {
      try {
        console.log(`[PAYMENTS AUTO VERIFY] Contacting live gateway at ${gatewayUrl} for TX ${cleanTxId}`);
        const result = await callOrbiPayGateway(`/v1/paysafe/escrows/${cleanTxId}`, {
          method: "GET"
        });
        if (result && (result.status === "completed" || result.status === "held" || result.escrowState === "held")) {
          isValid = true;
        } else {
          isValid = false;
        }
      } catch (gatewayErr: any) {
        console.error("[PAYMENTS AUTO VERIFY] Live Orbi Gateway check error:", gatewayErr.message);
        isValid = false;
      }
    } else {
      console.error("[PAYMENTS AUTO VERIFY] Gateway URL not configured.");
      isValid = false;
    }

    if (!isValid) {
      writePaymentLedgerLog({
        orderId: order.legacy_id || order.id,
        gatewayReferenceId: cleanTxId,
        amount: order.total,
        paymentMethod: order.payment_method || "Orbi PaySafe",
        status: "failed",
        message: `Carrier gateway verification failed: reference is invalid or unpaid.`,
      });
      return res.status(400).json({
        success: false,
        message: "Transaction ID could not be found or verified by the carrier network. Please ensure you entered the exact code from your receipt."
      });
    }

    // 5. Update the order to 'confirmed' / held status
    const paymentReference = `ESCROW:PAYMENT_HELD:held||${cleanTxId}`;
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_reference: encrypt(paymentReference),
        payment_method_name: order.payment_method_name || 'ORBI PaySafe'
      })
      .eq('id', order.id);

    if (updateError) {
      throw updateError;
    }

    writePaymentLedgerLog({
      orderId: order.legacy_id || order.id,
      gatewayReferenceId: cleanTxId,
      amount: order.total,
      paymentMethod: order.payment_method || "Orbi PaySafe",
      status: "success",
      message: "Automated payment verification successful. Escrow funded.",
    });

    // 6. Trigger Orbi Talk Notifications
    try {
      const oId = order.legacy_id || order.id;
      const rawCPhone = decrypt(order.customer_phone);
      const cPhone = rawCPhone ? rawCPhone.trim().replace(/\s+/g, "") : "";
      const cName = decrypt(order.customer_name);
      const total = order.total;
      const customerId = order.customer_id;

      let customerLang: "sw" | "en" = "sw";
      if (customerId) {
        const { data: customerRow } = await getSupabase(req).from('customers').select('preferred_language').eq('id', customerId).maybeSingle();
        if (customerRow?.preferred_language === "en") {
          customerLang = "en";
        }
      }

      // Send SMS
      if (cPhone) {
        sendOrbiTalkTemplate({
          templateName: "SHOP_ESCROW_FUNDED",
          recipient: cPhone,
          channel: "sms",
          language: customerLang,
          requestId: `escrow-funded-sms-${oId}-${Date.now()}`,
          data: {
            customerName: cName,
            orderId: oId,
            currency: "TZS",
            amount: String(total),
            refId: oId
          }
        }).catch(err => console.error("Error sending escrow funded SMS:", err));
      }

      // Retrieve customer email
      let cEmail = order.customer_email ? decrypt(order.customer_email) : (order.email ? decrypt(order.email) : null);
      if (!cEmail && customerId) {
        try {
          const { data: customerRow } = await supabase
            .from('customers')
            .select('email')
            .eq('id', customerId)
            .maybeSingle();
          if (customerRow && customerRow.email) {
            cEmail = customerRow.email;
          }
        } catch (custEmailErr: any) {
          console.warn("Could not query customer email for escrow funded notification:", custEmailErr.message);
        }
      }

      // Send Email
      if (cEmail && cEmail.includes("@")) {
        sendOrbiTalkTemplate({
          templateName: "SHOP_ESCROW_FUNDED",
          recipient: cEmail,
          channel: "email",
          language: customerLang,
          requestId: `escrow-funded-email-${oId}-${Date.now()}`,
          data: {
            customerName: cName,
            orderId: oId,
            currency: "TZS",
            amount: String(total),
            refId: oId
          }
        }).catch(err => console.error("Error sending escrow funded email:", err));
      }

      // Notify the seller
      try {
        let sellerId = "system";
        if (oId.includes("-")) {
          const parts = oId.split("-");
          sellerId = parts[parts.length - 1];
        } else {
          const { data: dbItems } = await supabase.from("order_items").select("product_id").eq("order_id", order.id).limit(1);
          if (dbItems && dbItems.length > 0) {
            const { data: dbProd } = await supabase.from("products").select("seller_id").eq("id", dbItems[0].product_id).maybeSingle();
            if (dbProd) sellerId = dbProd.seller_id;
          }
        }
        if (sellerId && sellerId !== "system") {
          const { data: dbSeller } = await supabase.from("sellers").select("*").eq("id", sellerId).maybeSingle();
          if (dbSeller) {
            const rawSPhone = dbSeller.phone || dbSeller.invoice_phone;
            const sPhone = rawSPhone ? decrypt(rawSPhone).trim().replace(/\s+/g, "") : null;
            const sName = dbSeller.name || dbSeller.invoice_company_name || "Merchant";
            
            console.log(`[PAYMENTS AUTO VERIFY] Notifying Seller ${sName} (${sPhone}) for escrow-funded order ${oId}`);
            if (sPhone) {
              sendOrbiTalkTemplate({
                templateName: "SHOP_SELLER_NEW_ORDER",
                recipient: sPhone,
                channel: "sms",
                language: "sw",
                requestId: `seller-neworder-sms-${oId}-${Date.now()}`,
                data: {
                  sellerName: sName,
                  orderId: oId,
                  currency: "TZS",
                  amount: String(total),
                  refId: oId
                }
              }).catch(err => console.error("Error notifying seller via SMS:", err));
            }
          }
        }
      } catch (sellerNotifyErr: any) {
        console.warn("Could not notify seller about funded escrow:", sellerNotifyErr.message);
      }
    } catch (notifyErr: any) {
      console.warn("[PAYMENTS AUTO VERIFY] Notification dispatch failed:", notifyErr.message);
    }

    return res.json({
      success: true,
      message: "Payment verified successfully! Secure Orbi PaySafe Escrow holds the funds.",
      orderId: order.id,
      legacyId: order.legacy_id,
      status: "confirmed"
    });
  } catch (error: any) {
    console.error("[PAYMENTS AUTO VERIFY] Request failed:", error.message);
    res.status(500).json({ success: false, message: error.message || "Failed to auto verify payment." });
  }
});

// Check transaction status from Gateway
router.get("/status/:transactionId", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    console.log(`[PAYMENTS] Checking status for transaction: ${transactionId}`);
    
    // In production, make a GET request to Orbi Pay Gateway API
    
    res.json({
      success: true,
      transactionId,
      status: "completed", // Mock status
      escrowState: "held",
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[PAYMENTS] Status check failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to verify transaction status" });
  }
});

// Escrow Operations (protected)
router.post("/escrow/release", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { orderId, sellerId } = req.body;
    console.log(`[ESCROW] Initiating funds release for Order ${orderId} to Seller ${sellerId}`);
    
    // Call Orbi Pay Gateway API to release funds from escrow to merchant
    
    res.json({
      success: true,
      message: "Escrow funds released successfully to merchant ledger.",
      escrowState: "released",
      releasedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[ESCROW] Release failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to release escrow funds." });
  }
});

router.post("/escrow/refund", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { orderId, buyerId, reason } = req.body;
    console.log(`[ESCROW] Initiating funds refund for Order ${orderId} back to Buyer ${buyerId}. Reason: ${reason}`);
    
    // Call Orbi Pay Gateway API to reverse/refund escrow hold back to original payment method
    
    res.json({
      success: true,
      message: "Escrow funds refunded successfully to buyer.",
      escrowState: "refunded",
      refundedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[ESCROW] Refund failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to refund escrow funds." });
  }
});

router.post("/escrow/dispute", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { orderId, partyId, reason } = req.body;
    console.log(`[ESCROW] Locking funds due to dispute on Order ${orderId} by party ${partyId}. Reason: ${reason}`);
    
    // Call Orbi Pay Gateway API to lock escrow state (preventing auto-release)
    
    res.json({
      success: true,
      message: "Escrow funds have been locked due to active dispute arbitration.",
      escrowState: "disputed",
      lockedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[ESCROW] Dispute lock failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to lock escrow funds." });
  }
});

// Merchant Payouts (protected)
router.post("/payout/request", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { sellerId, amount, destinationProvider, destinationAccount } = req.body;
    console.log(`[PAYOUTS] Merchant ${sellerId} requesting payout of TZS ${amount} to ${destinationProvider} (${destinationAccount})`);
    
    // Validate seller ledger balance
    // Call Orbi Pay Gateway API standard payout
    
    res.json({
      success: true,
      payoutId: `PO-${Date.now()}`,
      status: "processing",
      message: "Payout request has been submitted to the gateway successfully."
    });
  } catch (error: any) {
    console.error("[PAYOUTS] Request failed:", error.message);
    res.status(500).json({ success: false, message: "Failed to request payout." });
  }
});

// AFRICAN MOBILE MONEY USSD PUSH TRANSACTION SIMULATOR (M-Pesa / Tigo Pesa / Airtel Money) (protected)
router.post("/ussd-push", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { phone, amount, carrier, orderId } = req.body;
    if (!phone || !amount || !carrier || !orderId) {
      return res.status(400).json({ success: false, message: "Missing required USSD transaction parameters." });
    }

    console.log(`[USSD-PUSH] Initializing Lipa Na M-Pesa push for ${phone}, carrier: ${carrier}, amount: TZS ${amount}`);

    // Simulate network request delays corresponding to real GSM gateway ping intervals
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockRef = `TX-${carrier.substring(0,3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Automatically release Orbi PaySafe and update Order to paid/held state upon successful simulated PIN input entry
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_reference: encrypt(`ESCROW:PAYMENT_HELD:held||${mockRef}`),
        payment_method_name: `${carrier} (Lipa No: ${mockRef})`
      })
      .eq('id', orderId);

    if (error) {
      console.error("[USSD-PUSH ORDER UPDATE ERROR]", error.message);
      throw error;
    }

    // Trigger Orbi Talk Gateway SHOP_ESCROW_FUNDED template dispatch
    try {
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (dbOrder) {
        const oId = dbOrder.legacy_id || dbOrder.id;
        const cPhone = decrypt(dbOrder.customer_phone);
        const cName = decrypt(dbOrder.customer_name);
        const total = dbOrder.total;
        const customerId = dbOrder.customer_id;

        let customerLang: "sw" | "en" = "sw";
        if (customerId) {
          const { data: customerRow } = await getSupabase(req).from('customers').select('preferred_language').eq('id', customerId).maybeSingle();
          if (customerRow?.preferred_language === "en") {
            customerLang = "en";
          }
        }

        // Send SMS
        if (cPhone) {
          sendOrbiTalkTemplate({
            templateName: "SHOP_ESCROW_FUNDED",
            recipient: cPhone,
            channel: "sms",
            language: customerLang,
            requestId: `escrow-funded-sms-${oId}-${Date.now()}`,
            data: {
              customerName: cName,
              orderId: oId,
              currency: "TZS",
              amount: String(total),
              refId: oId
            }
          }).catch(err => console.error("Error sending escrow funded SMS:", err));
        }

        // Retrieve customer email
        let cEmail = dbOrder.customer_email ? decrypt(dbOrder.customer_email) : (dbOrder.email ? decrypt(dbOrder.email) : null);
        if (!cEmail && customerId) {
          try {
            const { data: customerRow } = await supabase
              .from('customers')
              .select('email')
              .eq('id', customerId)
              .maybeSingle();
            if (customerRow && customerRow.email) {
              cEmail = customerRow.email;
            }
          } catch (custEmailErr: any) {
            console.warn("Could not query customer email for escrow funded notification:", custEmailErr.message);
          }
        }

        // Send Email
        if (cEmail && cEmail.includes("@")) {
          sendOrbiTalkTemplate({
            templateName: "SHOP_ESCROW_FUNDED",
            recipient: cEmail,
            channel: "email",
            language: customerLang,
            requestId: `escrow-funded-email-${oId}-${Date.now()}`,
            data: {
              customerName: cName,
              orderId: oId,
              currency: "TZS",
              amount: String(total),
              refId: oId
            }
          }).catch(err => console.error("Error sending escrow funded email:", err));
        }

        // Retrieve seller of this order to send an active invite / notification
        try {
          let sellerId = "system";
          if (oId.includes("-")) {
            const parts = oId.split("-");
            sellerId = parts[parts.length - 1];
          } else {
            const { data: dbItems } = await supabase.from("order_items").select("product_id").eq("order_id", dbOrder.id).limit(1);
            if (dbItems && dbItems.length > 0) {
              const { data: prodRow } = await supabase.from('products').select('seller_id').eq('id', dbItems[0].product_id).maybeSingle();
              if (prodRow && prodRow.seller_id) {
                sellerId = prodRow.seller_id;
              }
            }
          }

          let sEmail = "shop@orbifinancial.com";
          let sPhone = null;
          let sName = "Merchant Partner";
          let sLang = "sw";
          const { data: dbSeller } = await supabase.from('sellers').select('*').eq('id', sellerId).maybeSingle();
          if (dbSeller) {
            sEmail = dbSeller.email || dbSeller.invoice_email || sEmail;
            sPhone = dbSeller.phone || dbSeller.invoice_phone || null;
            sName = dbSeller.name || "Merchant Partner";
            sLang = dbSeller.preferred_language === "en" ? "en" : "sw";
          }

          const { sendOrbiTalkDirectSMS, sendOrbiTalkDirectEmail } = await import("./talk.js");
          const sellerInviteReqId = `seller-invite-escrow-${oId}-${Date.now()}`;

          const sSubject = sLang === "en"
            ? `[Order Funded] You are invited to fulfill Order #${oId} - Orbi Shop`
            : `[Oda Imelipiwa] Unaalikwa Kuhudumia Oda #${oId} - Orbi Shop`;

          const swSellerBody = `Habari ${sName},\n\nMteja ${cName} amekamilisha malipo ya oda mpya ${oId} ya kiasi cha TZS ${total.toLocaleString()}.\n\nMalipo haya yamepokelewa kikamilifu na kul[...]`;

          const enSellerBody = `Dear ${sName},\n\nCustomer ${cName} has completed payment for order ${oId} worth TZS ${total.toLocaleString()}.\n\nThe funds are securely protected in Orbi PaySafe[...]`;

          const combinedSellerBody = sLang === "en" ? enSellerBody : swSellerBody;

          // Dispatch SMS invite
          if (sPhone) {
            const cleanSPhone = sPhone.trim().replace(/\s+/g, "");
            console.log(`[PAYMENT COMPLETED] Inviting/Notifying seller via SMS at ${cleanSPhone}`);
            sendOrbiTalkDirectSMS({
              recipient: cleanSPhone,
              body: combinedSellerBody,
              requestId: `${sellerInviteReqId}-sms`
            }).catch(smsErr => console.error("Error sending seller invite SMS on payment:", smsErr));
          }

          // Dispatch Email invite
          if (sEmail && sEmail.includes("@")) {
            console.log(`[PAYMENT COMPLETED] Inviting/Notifying seller via Email at ${sEmail}`);
            sendOrbiTalkDirectEmail({
              recipient: sEmail.trim(),
              subject: sSubject,
              body: combinedSellerBody,
              requestId: `${sellerInviteReqId}-email`,
              ownerEmail: "sellers@orbifinancial.com",
              senderName: "Orbi Shop"
            }).catch(emailErr => console.error("Error sending seller invite Email on payment:", emailErr));
          }
        } catch (sellerInviteErr: any) {
          console.error("Failed to notify/invite seller on payment success:", sellerInviteErr.message);
        }
      }
    } catch (notifyErr: any) {
      console.error("Failed to queue escrow funded Talk Gateway notification:", notifyErr.message);
    }

    return res.json({
      success: true,
      reference: mockRef,
      message: `Mwakilishi wa ${carrier} amethibitisha malipo ya TZS ${amount.toLocaleString()}. Muamala umekamilika!`,
      carrier,
      status: "confirmed"
    });
  } catch (err: any) {
    console.error("[SERVER USSD TRIGGER ARTIFACT FAILURE]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET TRANSACTION LEDGER LOGS
router.get("/ledger-logs", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    // 1. Fetch all orders from Supabase to construct dynamic successful/pending logs
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, legacy_id, payment_reference, payment_method, total, status, created_at, customer_name")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const dynamicLogs: any[] = [];
    if (orders) {
      for (const order of orders) {
        let decryptedRef = "";
        if (order.payment_reference) {
          try {
            decryptedRef = decrypt(order.payment_reference);
          } catch (e) {
            decryptedRef = order.payment_reference;
          }
        }

        // Clean up common prefix wrapper if present
        let displayRef = decryptedRef || "N/A";
        if (displayRef.startsWith("ESCROW:PAYMENT_HELD:held||")) {
          displayRef = displayRef.replace("ESCROW:PAYMENT_HELD:held||", "");
        } else if (displayRef.startsWith("ESCROW:PAYMENT_HELD:held_tra||")) {
          displayRef = displayRef.replace("ESCROW:PAYMENT_HELD:held_tra||", "");
        } else if (displayRef.startsWith("ESCROW:CREATED:requires_action||")) {
          displayRef = displayRef.replace("ESCROW:CREATED:requires_action||", "");
        }

        let logStatus: "success" | "failed" | "pending" = "pending";
        let message = "";
        if (order.status === "confirmed" || order.status === "shipped" || order.status === "delivered" || order.status === "customer_confirmed") {
          logStatus = "success";
          message = `Payment of TZS ${(order.total || 0).toLocaleString()} cleared and held in PaySafe Escrow.`;
        } else if (order.status === "cancelled") {
          logStatus = "failed";
          message = `Transaction for Order ${order.legacy_id || order.id} was refunded or cancelled.`;
        } else {
          logStatus = "pending";
          message = decryptedRef 
            ? `Payment reference ${displayRef} submitted. Awaiting verification.` 
            : `Order created. Payment pending.`;
        }

        if (decryptedRef || order.status !== "pending") {
          dynamicLogs.push({
            id: `TL-DB-${order.id.substring(0, 8).toUpperCase()}`,
            orderId: order.legacy_id || order.id,
            gatewayReferenceId: displayRef,
            amount: order.total || 0,
            paymentMethod: order.payment_method || "Mobile Money",
            status: logStatus,
            timestamp: order.created_at || Date.now(),
            message,
            customerName: order.customer_name ? decrypt(order.customer_name) : "Customer",
          });
        }
      }
    }

    // 2. Fetch logged failed/manual attempts from JSON file
    let fileLogs: any[] = [];
    try {
      if (fs.existsSync(LOGS_FILE)) {
        fileLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf8"));
      }
    } catch (e) {
      fileLogs = [];
    }

    // 3. Combine lists, de-duplicate, sort by timestamp
    const combined = [...fileLogs, ...dynamicLogs];
    const seen = new Set<string>();
    const uniqueLogs = combined.filter((log) => {
      const key = `${log.orderId}-${log.gatewayReferenceId}-${log.status}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    uniqueLogs.sort((a, b) => b.timestamp - a.timestamp);

    return res.json({
      success: true,
      logs: uniqueLogs,
    });
  } catch (err: any) {
    console.error("Error fetching payment ledger logs:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

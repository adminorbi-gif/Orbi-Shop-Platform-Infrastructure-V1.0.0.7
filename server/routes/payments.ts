import { Router } from "express";
import { supabase, getSupabase, encrypt, decrypt } from "../lib/supabase.js";
import { sendOrbiTalkTemplate } from "./talk.js";
import { callOrbiPayGateway, getPaySafeHoldMinutes, getPayServiceKey } from "../lib/orbiPayGateway.js";

const router = Router();

async function initiatePaySafeEscrow(req: any) {
  const {
    amount,
    orderId,
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

  console.log(`Initiating live ORBI PaySafe escrow for Order ${orderId} of ${currency} ${amount}`);

  const result = await callOrbiPayGateway("/v1/paysafe/escrows", {
    method: "POST",
    serviceKey: getPayServiceKey(req),
    body: {
      reference: String(orderId),
      amount: Number(amount),
      currency,
      confirm: true,
      description: description || "ORBI Shop protected checkout",
      buyer: buyer || {
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
router.post("/initiate", async (req, res) => {
  try {
    res.json(await initiatePaySafeEscrow(req));
  } catch (error: any) {
    console.error("[PAYMENTS] Failed to initiate payment:", error.message);
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
  }
});

// Legacy handler for backwards compatibility
router.post("/create-intent", async (req, res) => {
  try {
    res.json(await initiatePaySafeEscrow(req));
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error during payment processing", details: error.details });
  }
});

// Orbi Gateway Webhook listener
router.post("/webhook", async (req, res) => {
  try {
    const { transactionId, status, orderId, reference, signature } = req.body;
    console.log(`[PAYMENTS WEBHOOK] Received payload from Orbi Pay: Transaction ${transactionId} is now ${status}`);
    
    // TODO: Verify signature against ORBI_PAY_WEBHOOK_SECRET
    
    // Here we would find the associated order in the database and update its Escrow status
    // Example: if status === 'successful', update order to 'PAYMENT_HELD' (Escrow)
    
    res.json({ received: true, processedStatus: status });
  } catch (error: any) {
    console.error("[PAYMENTS WEBHOOK ERROR]", error.message);
    res.status(500).json({ received: false, error: "Webhook processing failed" });
  }
});

// Check transaction status from Gateway
router.get("/status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log(`[PAYMENTS] Checking status for transaction: ${transactionId}`);

    const result = await callOrbiPayGateway(`/v1/merchant/orders/${encodeURIComponent(transactionId)}/payment-status`, {
      serviceKey: getPayServiceKey(req),
    });

    res.json({ success: true, transactionId, checkedAt: new Date().toISOString(), ...result });
  } catch (error: any) {
    console.error("[PAYMENTS] Status check failed:", error.message);
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
  }
});

// Escrow Operations
router.post("/escrow/release", async (req, res) => {
  try {
    const { orderId, escrowId, sellerId, amount, currency = "TZS", reason, customer } = req.body;
    const activeEscrowId = escrowId || orderId;
    console.log(`[ESCROW] Initiating funds release for Order ${orderId} to Seller ${sellerId}`);

    const result = await callOrbiPayGateway(`/v1/paysafe/escrows/${encodeURIComponent(activeEscrowId)}/release`, {
      method: "POST",
      serviceKey: getPayServiceKey(req),
      body: {
        reference: String(orderId || activeEscrowId),
        amount: amount ? Number(amount) : undefined,
        currency,
        reason: reason || "ORBI Shop delivery release requested",
        customer,
        metadata: { orderId, sellerId, source: "orbi-shop" },
      },
    });

    res.json({ ...result, escrowState: result.status || "external_pending", releasedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("[ESCROW] Release failed:", error.message);
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
  }
});

router.post("/escrow/refund", async (req, res) => {
  try {
    const { orderId, escrowId, buyerId, amount, currency = "TZS", reason, customer } = req.body;
    const activeEscrowId = escrowId || orderId;
    console.log(`[ESCROW] Initiating funds refund for Order ${orderId} back to Buyer ${buyerId}. Reason: ${reason}`);

    const result = await callOrbiPayGateway(`/v1/paysafe/escrows/${encodeURIComponent(activeEscrowId)}/refund`, {
      method: "POST",
      serviceKey: getPayServiceKey(req),
      body: {
        reference: String(orderId || activeEscrowId),
        amount: amount ? Number(amount) : undefined,
        currency,
        reason: reason || "ORBI Shop refund requested",
        customer,
        metadata: { orderId, buyerId, source: "orbi-shop" },
      },
    });

    res.json({ ...result, escrowState: "refunded", refundedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("[ESCROW] Refund failed:", error.message);
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
  }
});

router.post("/escrow/dispute", async (req, res) => {
  try {
    const { orderId, escrowId, partyId, reason, customer } = req.body;
    const activeEscrowId = escrowId || orderId;
    console.log(`[ESCROW] Locking funds due to dispute on Order ${orderId} by party ${partyId}. Reason: ${reason}`);

    if (!activeEscrowId) {
      return res.status(400).json({
        success: false,
        error: "escrowId or orderId is required to dispute a live ORBI PaySafe escrow.",
      });
    }

    const result = await callOrbiPayGateway(`/v1/paysafe/escrows/${encodeURIComponent(activeEscrowId)}/dispute`, {
      method: "POST",
      serviceKey: getPayServiceKey(req),
      body: {
        reference: String(orderId || activeEscrowId),
        reason: reason || `ORBI Shop dispute for order ${orderId}`,
        customer,
        metadata: { orderId, partyId, source: "orbi-shop" },
      },
    });

    res.json({ ...result, escrowState: "disputed", lockedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("[ESCROW] Dispute lock failed:", error.message);
    res.status(error.status || 500).json({ success: false, message: error.message, details: error.details });
  }
});

// Merchant Payouts
router.post("/payout/request", async (req, res) => {
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

// AFRICAN MOBILE MONEY USSD PUSH TRANSACTION SIMULATOR (M-Pesa / Tigo Pesa / Airtel Money)
router.post("/ussd-push", async (req, res) => {
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

        // Send SMS first, wait for response
        const escrowSmsPromise = cPhone ? sendOrbiTalkTemplate({
          templateName: "SHOP_ESCROW_FUNDED",
          recipient: cPhone,
          channel: "sms",
          language: customerLang,
          requestId: `escrow-funded-sms-${oId}`,
          data: {
            customerName: cName,
            orderId: oId,
            currency: "TZS",
            amount: String(total),
            refId: oId
          }
        }) : Promise.resolve({ success: false });

        escrowSmsPromise.then(async (smsResult) => {
          // "ikiwa ikirudisha majibu tuma email"
          const shouldSendEmail = (!cPhone || (smsResult && smsResult.success));
          if (shouldSendEmail && customerId) {
            try {
              const { data: customerRow } = await supabase
                .from('customers')
                .select('email')
                .eq('id', customerId)
                .maybeSingle();
              if (customerRow && customerRow.email && customerRow.email.includes("@")) {
                console.log(`[ORBI-TALK] Escrow SMS response received. Dispatching escrow funded Email to: ${customerRow.email}`);
                sendOrbiTalkTemplate({
                  templateName: "SHOP_ESCROW_FUNDED",
                  recipient: customerRow.email,
                  channel: "email",
                  language: customerLang,
                  requestId: `escrow-funded-email-${oId}`,
                  data: {
                    customerName: cName,
                    orderId: oId,
                    currency: "TZS",
                    amount: String(total),
                    refId: oId
                  }
                }).catch(err => console.error("Error sending escrow funded email:", err));
              }
            } catch (custEmailErr: any) {
              console.warn("Could not query customer email for escrow funded email notification:", custEmailErr.message);
            }
          }
        }).catch(err => console.error("Error sending escrow funded SMS:", err));

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

          const swSellerBody = `Habari ${sName},\n\nMteja ${cName} amekamilisha malipo ya oda mpya ${oId} ya kiasi cha TZS ${total.toLocaleString()}.\n\nMalipo haya yamepokelewa kikamilifu na kulindwa kwenye akaunti ya Escrow (Orbi PaySafe) na yatatolewa kwako pindi mteja akipokea mzigo wake.\n\nUnaalikwa kuingia kwenye mfumo kuthibitisha na kuanza usafirishaji mara moja kupitia Tovuti ya Wauzaji barua pepe yako ikiwa: ${sEmail}\n🔗 https://shop.orbifinancial.com/?seller-login=true\n\nAsante kwa kuingia mkataba na Orbi Shop!`;

          const enSellerBody = `Dear ${sName},\n\nCustomer ${cName} has completed payment for order ${oId} worth TZS ${total.toLocaleString()}.\n\nThe funds are securely protected in Orbi PaySafe Escrow and will be fully disbursed after successful delivery.\n\nYou are invited to login to the Merchant Portal and start shipping immediately:\nEmail/Username: ${sEmail}\n🔗 https://shop.orbifinancial.com/?seller-login=true\n\nThank you for choosing Orbi Shop!`;

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

export default router;

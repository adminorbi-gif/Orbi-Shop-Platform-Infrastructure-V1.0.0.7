import { Router } from "express";
import { supabase, getSupabase, encrypt, decrypt } from "../lib/supabase.js";
import { sendOrbiTalkTemplate } from "./talk.js";

const router = Router();

// Example Orbi Pay Webhook/Payment Intent Initialization Endpoint
router.post("/initiate", async (req, res) => {
  try {
    const { amount, orderId, customerId, paymentMethod, currency = "TZS" } = req.body;
    
    // In a real implementation, you would call the actual Payment Gateway API here
    // For now, we mock the success response to be processed by Orbi Pay
    
    console.log(`Initiating Orbi Pay transaction for Order ${orderId} of ${currency} ${amount} via ${paymentMethod || 'standard'}`);
    
    res.json({
      success: true,
      transactionId: `ORBI-PAY-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      status: "pending_orbi_paysafe",
      redirectUrl: "https://pay.orbifinancial.com/checkout/mock",
      amount,
      currency,
      message: "Payment intent initialized successfully via Orbi Pay Gateway"
    });
  } catch (error: any) {
    console.error("[PAYMENTS] Failed to initiate payment:", error.message);
    res.status(500).json({ success: false, message: "Internal server error during payment initialization" });
  }
});

// Legacy handler for backwards compatibility
router.post("/create-intent", async (req, res) => {
  try {
    const { amount, orderId, customerId } = req.body;
    
    console.log(`Creating payment intent for Order ${orderId} of TZS ${amount}`);
    
    res.json({
      success: true,
      transactionId: `ORBI-PAY-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      status: "pending_orbi_paysafe",
      amount,
      message: "Payment intent created successfully via Orbi Pay Gateway"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error during payment processing" });
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

// Escrow Operations
router.post("/escrow/release", async (req, res) => {
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

router.post("/escrow/refund", async (req, res) => {
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

router.post("/escrow/dispute", async (req, res) => {
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

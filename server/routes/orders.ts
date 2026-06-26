import { Router } from "express";
import { supabase, getSupabase, encrypt, decryptObject, decrypt } from "../lib/supabase.js";

const router = Router();

// Robust State Machine Helpers for Decoupled Order Lifecycle and Escrow Payments
export function parseDBRecord(o: any) {
  let mappedStatus = o.status;
  let paymentStatus = "requires_action";
  let mappedPaymentRef = o.payment_reference || "";

  // If the record was NOT decrypted by decryptObject (e.g. key mismatch or direct db query),
  // and we see ciphertext structure, we decrypt it.
  if (mappedPaymentRef && mappedPaymentRef.includes(':') && mappedPaymentRef.length > 50 && !mappedPaymentRef.startsWith("ESCROW:")) {
    const attempted = decrypt(mappedPaymentRef);
    if (attempted !== mappedPaymentRef) {
       mappedPaymentRef = attempted; // Success
    } else {
       // Failed to decrypt ciphertext (e.g. key changed), hide raw cipher from UI
       mappedPaymentRef = "";
    }
  }

  if (mappedPaymentRef.startsWith("ESCROW:")) {
    const parts = mappedPaymentRef.split("||");
    const header = parts[0];
    mappedPaymentRef = parts.slice(1).join("||");
    const subparts = header.split(":");
    if (subparts.length >= 3) {
      mappedStatus = subparts[1];
      paymentStatus = subparts[2];
    }
  } else {
    // Legacy mapping compatibility
    if (mappedPaymentRef.startsWith("SHIPPED||")) {
      mappedStatus = "SHIPPED";
      paymentStatus = "held";
      mappedPaymentRef = mappedPaymentRef.substring("SHIPPED||".length);
    } else if (mappedPaymentRef.startsWith("DELIVERED||")) {
      mappedStatus = "DELIVERED";
      paymentStatus = "held";
      mappedPaymentRef = mappedPaymentRef.substring("DELIVERED||".length);
    } else if (mappedPaymentRef.startsWith("CUSTCONF||")) {
      mappedStatus = "BUYER_CONFIRMED";
      paymentStatus = "released";
      mappedPaymentRef = mappedPaymentRef.substring("CUSTCONF||".length);
    } else if (mappedPaymentRef.startsWith("ARCHIVED||")) {
      mappedStatus = "RELEASED";
      paymentStatus = "released";
      mappedPaymentRef = mappedPaymentRef.substring("ARCHIVED||".length);
    } else {
      if (o.status === "pending") {
        mappedStatus = "CREATED";
        paymentStatus = "requires_action";
      } else if (o.status === "confirmed") {
        mappedStatus = "PAYMENT_HELD";
        paymentStatus = "held";
      } else if (o.status === "shipped") {
        mappedStatus = "SHIPPED";
        paymentStatus = "held";
      } else if (o.status === "delivered") {
        mappedStatus = "DELIVERED";
        paymentStatus = "held";
      } else if (o.status === "cancelled") {
        mappedStatus = "CANCELLED";
        paymentStatus = "failed";
      }
    }
  }

  return {
    status: mappedStatus.toUpperCase(),
    paymentStatus: paymentStatus,
    paymentReference: mappedPaymentRef
  };
}

export function getPaymentStateForOrderState(orderStatus: string, currentPayStatus?: string): string {
  switch (orderStatus.toUpperCase()) {
    case "CREATED":
      return "requires_action";
    case "AWAITING_PAYMENT":
      return "processing";
    case "PAYMENT_HELD":
      return "held";
    case "PROCESSING":
    case "SHIPPED":
    case "DELIVERED":
      return currentPayStatus || "held";
    case "BUYER_CONFIRMED":
      return "released";
    case "DISPUTED":
      return "disputed";
    case "RELEASED":
      return "released";
    case "REFUNDED":
      return "refunded";
    case "CANCELLED":
      return "failed";
    default:
      return currentPayStatus || "requires_action";
  }
}

export function getDBStatusForOrderState(orderStatus: string): string {
  switch (orderStatus.toUpperCase()) {
    case "CREATED":
    case "AWAITING_PAYMENT":
      return "pending";
    case "PAYMENT_HELD":
    case "PROCESSING":
    case "DISPUTED":
    case "SHIPPED":
    case "DELIVERED":
    case "BUYER_CONFIRMED":
    case "RELEASED":
      return "confirmed";
    case "REFUNDED":
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

export const allowedTransitions: Record<string, string[]> = {
  "CREATED": ["AWAITING_PAYMENT", "PAYMENT_HELD", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
  "AWAITING_PAYMENT": ["PAYMENT_HELD", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
  "PAYMENT_HELD": ["PROCESSING", "SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED", "CANCELLED", "REFUNDED", "DISPUTED"],
  "PROCESSING": ["SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED", "CANCELLED", "REFUNDED", "DISPUTED"],
  "SHIPPED": ["DELIVERED", "BUYER_CONFIRMED", "RELEASED", "CANCELLED", "REFUNDED", "DISPUTED"],
  "DELIVERED": ["BUYER_CONFIRMED", "RELEASED", "REFUNDED", "DISPUTED"],
  "BUYER_CONFIRMED": ["RELEASED", "REFUNDED", "DISPUTED"],
  "DISPUTED": ["PAYMENT_HELD", "PROCESSING", "SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "RELEASED", "REFUNDED", "CANCELLED"],
  "RELEASED": [],
  "REFUNDED": [],
  "CANCELLED": []
};

// GET /api/v1/orders - Retrieve order listings and items
router.get("/", async (req, res) => {
  try {
    let selectRes = await getSupabase(req).from('orders').select(`*, items:order_items(*)`).or('is_archived.eq.false,is_archived.is.null').order('created_at', { ascending: false });
    if (selectRes.error) throw selectRes.error;
    const data = selectRes.data;

    const decryptedData = decryptObject(data || []);
    const mapped = decryptedData.map((o: any) => {
      const parsed = parseDBRecord(o);
      
      return {
        id: o.id,
        items: o.items.map((i: any) => ({
          id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: '', // Placeholder
          stock: 0,
          images: [] 
        })),
        total: o.total,
        status: parsed.status,
        paymentStatus: parsed.paymentStatus,
        customerId: o.customer_id,
        customer_id: o.customer_id,
        customer: {
          name: o.customer_name,
          phone: o.customer_phone,
          address: o.customer_address
        },
        customerDetails: {
          name: o.customer_name,
          phone: o.customer_phone,
          address: o.customer_address
        },
        date: new Date(o.created_at).getTime(),
        paymentMethod: o.payment_method,
        paymentMethodName: o.payment_method_name,
        paymentReference: parsed.paymentReference,
        riderName: o.rider_name || undefined,
        riderPhone: o.rider_phone || undefined,
        riderVehicle: o.rider_vehicle || undefined
      };
    });

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/v1/orders error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/orders - Update order metadata (status, payment reference)
router.post("/", async (req, res) => {
  try {
    const order = req.body;
    if (order.id && order.id.length > 20) {
      const payload: any = {};
      
      let loggedInStaffName = order.staffName || "System Auto";
      let loggedInStaffEmail = order.staffEmail || "admin.orbi@gmail.com";
      
      const appUrl = process.env.APP_URL || "https://orbi.shop";

      // 1. Unconditionally retrieve existing order status and payment reference
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .maybeSingle();

      let previousStatus = "CREATED";
      let existingRawRef = "";
      let existingPaymentStatus = "requires_action";

      if (dbOrder) {
        const parsed = parseDBRecord(dbOrder);
        previousStatus = parsed.status;
        existingRawRef = parsed.paymentReference;
        existingPaymentStatus = parsed.paymentStatus;
      }

      // 2. Compute the target active status and raw payment reference
      let targetState = order.status !== undefined ? order.status.toUpperCase() : previousStatus;
      
      // Normalize legacy states to the high-fidelity state machine equivalents
      if (targetState === "PENDING") targetState = "CREATED";
      else if (targetState === "CONFIRMED") targetState = "PAYMENT_HELD";
      else if (targetState === "CUSTOMER_CONFIRMED") targetState = "BUYER_CONFIRMED";
      else if (targetState === "ARCHIVED") targetState = "RELEASED";

      const activeStatus = targetState;
      
      // Server-side validation to ensure that frontend state cannot bypass backend order flow logic
      if (order.status !== undefined && activeStatus !== previousStatus) {
        const allowed = allowedTransitions[previousStatus] || [];
        if (!allowed.includes(activeStatus)) {
          return res.status(400).json({ success: false, error: `Invalid order state transition from ${previousStatus} to ${activeStatus}` });
        }
      }

      let targetRawRef = existingRawRef;
      if (order.paymentReference !== undefined) {
        // Strip any legacy prefix
        targetRawRef = order.paymentReference.replace(/^(SHIPPED\|\||DELIVERED\|\||CUSTCONF\|\||ARCHIVED\|\|)/, "");
      }

      // Compute the final synchronised payments status
      const finalPaymentStatus = getPaymentStateForOrderState(activeStatus, existingPaymentStatus);

      // 3. Determine the final status & payment_ref column values
      const finalStatus = getDBStatusForOrderState(activeStatus);
      const finalPaymentRef = `ESCROW:${activeStatus}:${finalPaymentStatus}||${targetRawRef}`;

      // 4. Map back to database columns
      payload.status = finalStatus;
      payload.payment_reference = encrypt(finalPaymentRef);
      
      if (order.riderName !== undefined) payload.rider_name = order.riderName;
      if (order.riderPhone !== undefined) payload.rider_phone = order.riderPhone;
      if (order.riderVehicle !== undefined) payload.rider_vehicle = order.riderVehicle;
      
      let { error } = await getSupabase(req).from('orders').update(payload).eq('id', order.id);
      if (error) {
        console.warn(`[Orders API] User client order update failed with code ${error.code}: ${error.message}. Retrying with service-role admin access...`);
        const retry = await supabase.from('orders').update(payload).eq('id', order.id);
        error = retry.error;
      }
      
      // Graceful schema defense fallback: if columns do not exist in the database yet, retry update without them
      if (error && (error.message?.includes("column") || error.code === "P0002" || error.code === "42703")) {
        console.warn("Rider columns do not exist yet. Retrying update without rider fields:", error.message);
        const safePayload = {
          status: payload.status,
          payment_reference: payload.payment_reference
        };
        let retryResult = await getSupabase(req).from('orders').update(safePayload).eq('id', order.id);
        if (retryResult.error) {
          console.warn("[Orders API] User client order safe-update failed. Retrying with service-role admin access...");
          retryResult = await supabase.from('orders').update(safePayload).eq('id', order.id);
        }
        error = retryResult.error;
      }
      
      if (error) throw error;

      // Trigger Orbi Talk Gateway Notifications
      try {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('id', order.id)
          .maybeSingle();
        if (dbOrder) {
          const oId = dbOrder.legacy_id || dbOrder.id;
          const cPhone = decrypt(dbOrder.customer_phone);
          const cName = decrypt(dbOrder.customer_name);
          
          let cEmail = dbOrder.customer_email ? decrypt(dbOrder.customer_email) : (dbOrder.email ? decrypt(dbOrder.email) : null);
          if (!cEmail && dbOrder.customer_id) {
            try {
              const { data: customerRow } = await supabase
                .from('customers')
                .select('email')
                .eq('id', dbOrder.customer_id)
                .maybeSingle();
              if (customerRow && customerRow.email) {
                cEmail = customerRow.email; // customer table email is plaintext
              }
            } catch (custErr: any) {
              console.warn("Could not retrieve customer email for order flow transition notification:", custErr.message);
            }
          }
          
          const total = dbOrder.total;

          const cleanNumericId = dbOrder.id.substring(0, 8).toUpperCase();
          const trackLink = `${appUrl}/?order_id=${cleanNumericId}`;

          const { sendOrbiTalkDirectSMS, sendOrbiTalkDirectEmail } = await import("./talk.js");

          // Determine customer's preferred language
          let customerLang: "sw" | "en" = "sw";
          if (dbOrder.customer_id) {
            const { data: customerRow } = await supabase
              .from('customers')
              .select('preferred_language')
              .eq('id', dbOrder.customer_id)
              .maybeSingle();
            if (customerRow?.preferred_language === "en") {
              customerLang = "en";
            }
          }

          // Target notifications for all order transitions
          let mappedActiveForNotify = activeStatus.toLowerCase();
          if (activeStatus === "PAYMENT_HELD" || activeStatus === "PROCESSING") mappedActiveForNotify = "confirmed";
          else if (activeStatus === "SHIPPED") mappedActiveForNotify = "shipped";
          else if (activeStatus === "DELIVERED") mappedActiveForNotify = "delivered";
          else if (activeStatus === "BUYER_CONFIRMED" || activeStatus === "RELEASED") mappedActiveForNotify = "customer_confirmed";
          else if (activeStatus === "CANCELLED" || activeStatus === "REFUNDED") mappedActiveForNotify = "cancelled";

          let mappedPreviousForNotify = previousStatus.toLowerCase();
          if (previousStatus === "PAYMENT_HELD" || previousStatus === "PROCESSING") mappedPreviousForNotify = "confirmed";
          else if (previousStatus === "SHIPPED") mappedPreviousForNotify = "shipped";
          else if (previousStatus === "DELIVERED") mappedPreviousForNotify = "delivered";
          else if (previousStatus === "BUYER_CONFIRMED" || previousStatus === "RELEASED") mappedPreviousForNotify = "customer_confirmed";
          else if (previousStatus === "CANCELLED" || previousStatus === "REFUNDED") mappedPreviousForNotify = "cancelled";

          if (mappedActiveForNotify !== mappedPreviousForNotify) {
            let smsBody = "";
            let emailSubject = "";
            let emailBody = "";

            if (mappedActiveForNotify === "confirmed") {
              if (customerLang === "en") {
                smsBody = `Hello ${cName}, your order #${cleanNumericId} total TZS ${total} has been confirmed and is being prepared for shipping! Track here: ${trackLink}`;
                emailSubject = `Order Confirmed: Your Order #${cleanNumericId} is Approved!`;
                emailBody = `Hello ${cName},\n\nWe are pleased to inform you that your order #${cleanNumericId} has been confirmed and accepted by Orbi Shop.\n\nOrder Value: TZS ${total}\n\nYou can track the shipping progress anytime via this unique link:\n${trackLink}\n\nThank you for choosing Orbi Shop!`;
              } else {
                smsBody = `Habari ${cName}, oda yako #${cleanNumericId} ya jumla ya TZS ${total} imethibitishwa na inatayarishwa kwa ajili ya usafirishaji! Fuatilia hapa: ${trackLink}`;
                emailSubject = `Oda Imethibitishwa: Oda Yako #${cleanNumericId} Imeidhinishwa!`;
                emailBody = `Habari ${cName},\n\nTunakujulisha kuwa oda yako #${cleanNumericId} imethibitishwa na kukubaliwa na duka la Orbi Shop.\n\nThamani ya Oda: TZS ${total}\n\nUnaweza kufuatilia maendeleo ya usafirishaji wakati wowote kupitia kiungo hiki cha kipekee:\n${trackLink}\n\nAsante kwa kuchagua Orbi Shop!`;
              }
            } else if (mappedActiveForNotify === "shipped") {
              if (customerLang === "en") {
                smsBody = `Hello ${cName}, our delivery partner is on the way with your order #${cleanNumericId}! Track active location live: ${trackLink}`;
                emailSubject = `On Its Way: Your order #${cleanNumericId} has been shipped!`;
                emailBody = `Hello ${cName},\n\nYour order #${cleanNumericId} has been handed over to our carrier and is now on its way to you!\n\nYou can view a live tracker map and follow your package using this link:\n${trackLink}\n\nThank you for shopping with us!`;
              } else {
                smsBody = `Habari ${cName}, msafirishaji wetu yuko njiani kuleta oda yako #${cleanNumericId}! Fuatilia eneo lake live sasa hivi hapa: ${trackLink}`;
                emailSubject = `Mzigo Uko Njiani: Oda yako #${cleanNumericId} imesafirishwa!`;
                emailBody = `Habari ${cName},\n\nMzigo wako wa oda #${cleanNumericId} umekabidhiwa kwa msafirishaji na hivi sasa uko njiani kuelekea kwako!\n\nUnaweza kuona ramani live ya msafirishaji na kufuatilia mzigo wako kupitia kiungo hiki cha kipekee:\n${trackLink}\n\nAsante kwa kufanya biashara nasi!`;
              }
            } else if (mappedActiveForNotify === "delivered") {
              if (customerLang === "en") {
                smsBody = `Hello ${cName}, your order #${cleanNumericId} was successfully delivered! Please confirm receipt to finalize payment: ${trackLink}`;
                emailSubject = `Package Arrived: Order #${cleanNumericId} Has Been Delivered!`;
                emailBody = `Hello ${cName},\n\nYour order #${cleanNumericId} has been successfully delivered to your specified address.\n\nPlease click this link to confirm receipt and download your official receipt:\n${trackLink}\n\nThank you, and we hope to serve you again!`;
              } else {
                smsBody = `Habari ${cName}, oda yako #${cleanNumericId} imefikishwa salama! Tafadhali thibitisha hapa ili kukamilisha ununuzi: ${trackLink}`;
                emailSubject = `Mzigo Umewasili: Oda #${cleanNumericId} Imefikishwa!`;
                emailBody = `Habari ${cName},\n\nOda yako #${cleanNumericId} imefikishwa salama katika anwani yako.\n\nTafadhali bofya kiungo hiki ili kuthibitisha kupokea na kutoa mrejesho au kupakua risiti yako:\n${trackLink}\n\nTunayofuraha kukuhudumia tena!`;
              }
            } else if (mappedActiveForNotify === "customer_confirmed") {
              if (customerLang === "en") {
                smsBody = `Hello ${cName}, thank you for confirming receipt of order #${cleanNumericId}! Your transaction is complete. Details: ${trackLink}`;
                emailSubject = `Purchase Completed: Order #${cleanNumericId} Received Confirmed`;
                emailBody = `Hello ${cName},\n\nThank you for confirming receipt of your order #${cleanNumericId}.\n\nThe full buying lifecycle is now complete. Feel free to view transaction ledger history or download your receipt anytime here:\n${trackLink}\n\nIt is our absolute pleasure to serve you!`;
              } else {
                smsBody = `Habari ${cName}, asante kwa kuthibitisha kuwa umepokea oda #${cleanNumericId}! Ununuzi wako umekamilishwa salama. Maelezo zaidi: ${trackLink}`;
                emailSubject = `Ununuzi Umekamilika: Oda #${cleanNumericId} Imethibitishwa Kupokelewa`;
                emailBody = `Habari ${cName},\n\nAsante kwa kuthibitisha kuwa umepokea mzigo wako wa oda #${cleanNumericId} salama na kwa kuridhika.\n\nMamnyororo mzima wa ununuzi sasa umekamilika. Unaweza kuona mnyororo mzima wa muamala au kupakua risiti yako wakati wowote hapa:\n${trackLink}\n\nTunayofuraha kukuhudumia!`;
              }

              // Fire official Orbi Talk SHOP_DELIVERY_CONFIRMED Template
              try {
                const { sendOrbiTalkTemplate } = await import("./talk.js");
                sendOrbiTalkTemplate({
                  templateName: "SHOP_DELIVERY_CONFIRMED",
                  recipient: cEmail || cPhone || "",
                  channel: cEmail ? "email" : "sms",
                  language: customerLang,
                  requestId: `delivery-confirmed-template-${cleanNumericId}-${Date.now()}`,
                  data: {
                    customerName: cName,
                    orderId: cleanNumericId,
                    currency: "TZS",
                    amount: String(total),
                    refId: cleanNumericId
                  }
                }).catch(err => console.error("Error sending SHOP_DELIVERY_CONFIRMED template:", err));
              } catch (tplErr: any) {
                console.warn("Could not dispatch SHOP_DELIVERY_CONFIRMED template:", tplErr.message);
              }
            } else if (mappedActiveForNotify === "cancelled") {
              if (customerLang === "en") {
                smsBody = `Hello ${cName}, your order #${cleanNumericId} has been cancelled or refunded by the shop. Details: ${trackLink}`;
                emailSubject = `Order Alert: Order #${cleanNumericId} Cancelled / Refunded`;
                emailBody = `Hello ${cName},\n\nWe are writing to notify you that your order #${cleanNumericId} has been cancelled or refunded.\n\nFor details, inquiries, or any other issues, please visit our tracking link or reach support:\n${trackLink}\n\nThank you, and we apologize for any inconvenience!`;
              } else {
                smsBody = `Habari ${cName}, oda yako #${cleanNumericId} imesitishwa au kughairiwa na duka. Kama una maswali wasiliana nasi. Details: ${trackLink}`;
                emailSubject = `Taarifa ya Oda: Oda #${cleanNumericId} Imeghairiwa`;
                emailBody = `Habari ${cName},\n\nTunakujulisha kuwa oda yako #${cleanNumericId} imesitishwa au kughairiwa.\n\nKama kuna marejesho au maswali, bofya kiungo hiki au wasiliana na usaidizi wetu:\n${trackLink}\n\nTunajali kuridhika kwako!`;
              }

              // Fire official Orbi Talk SHOP_REFUND_PROCESSED Template
              try {
                const { sendOrbiTalkTemplate } = await import("./talk.js");
                sendOrbiTalkTemplate({
                  templateName: "SHOP_REFUND_PROCESSED",
                  recipient: cEmail || cPhone || "",
                  channel: cEmail ? "email" : "sms",
                  language: customerLang,
                  requestId: `refund-processed-template-${cleanNumericId}-${Date.now()}`,
                  data: {
                    customerName: cName,
                    orderId: cleanNumericId,
                    currency: "TZS",
                    amount: String(total),
                    refId: cleanNumericId
                  }
                }).catch(err => console.error("Error sending SHOP_REFUND_PROCESSED template:", err));
              } catch (tplErr: any) {
                console.warn("Could not dispatch SHOP_REFUND_PROCESSED template:", tplErr.message);
              }
            }

            const dispatchTasks = [];

            if (smsBody && cPhone) {
              dispatchTasks.push(
                sendOrbiTalkDirectSMS({
                  recipient: cPhone,
                  body: smsBody,
                  requestId: `order-flow-sms-${activeStatus}-${oId}-${Date.now()}`
                }).catch(e => console.error(`Error sending flow SMS for status ${activeStatus}:`, e))
              );
            }

            if (emailBody && cEmail && cEmail.includes("@")) {
              dispatchTasks.push(
                sendOrbiTalkDirectEmail({
                  recipient: cEmail,
                  subject: emailSubject,
                  body: emailBody,
                  requestId: `order-flow-email-${activeStatus}-${oId}-${Date.now()}`,
                  ownerEmail: "shop@orbifinancial.com",
                  senderName: "Orbi Shop"
                }).catch(e => console.error(`Error sending flow Email for status ${activeStatus}:`, e))
              );
            }

            Promise.allSettled(dispatchTasks).then(results => {
              console.log(`[ORBI-TALK] Dispatched ${results.length} notifications for order ${oId} status ${activeStatus}`);
            });
          }
        }
      } catch (notifyErr: any) {
        console.error("Failed to trigger Talk Gateway update notifications:", notifyErr.message);
      }

      // 5. Trigger Automatic TRA Sales Submission if enabled of-demand
      const isDeliveredActive = (activeStatus === "DELIVERED" || activeStatus === "BUYER_CONFIRMED" || activeStatus === "RELEASED");
      const isDeliveredPrevious = (previousStatus === "DELIVERED" || previousStatus === "BUYER_CONFIRMED" || previousStatus === "RELEASED");
      if (isDeliveredActive && !isDeliveredPrevious) {
        try {
          const { data: promoData } = await supabase
            .from("promotions")
            .select("*")
            .eq("id", "tra_config_v1_id")
            .maybeSingle();

          let traConfig: any = {};
          if (promoData && promoData.description) {
            try {
              traConfig = JSON.parse(promoData.description);
            } catch (e) {}
          }

          if (traConfig.autoTaxSales) {
            console.log(`[TRA AUTO-SUBMIT] Order ${order.id} transitioned to DELIVERED flow. Starting TRA validation...`);
            const { submitReceiptToTraInternal } = await import("./tra.js");
            const result = await submitReceiptToTraInternal(order.id);
            console.log(`[TRA AUTO-SUBMIT-RESULT] Result for order ${order.id}:`, result);
          }
        } catch (autoErr: any) {
          console.error("[TRA AUTO-SUBMIT-ERROR] Automated TRA validation failed silently:", autoErr.message);
        }
      }

      // Audit Log status change
      if (activeStatus !== previousStatus) {
        const logEntry = {
          order_id: order.id,
          previous_status: previousStatus,
          new_status: activeStatus,
          staff_name: loggedInStaffName,
          staff_email: loggedInStaffEmail
        };

        const { error: logError } = await getSupabase(req).from('order_status_logs').insert([logEntry]);
        if (logError) {
          console.error("[AUDIT LOG] order_status_logs insert failed:", logError.message);
          // Removed the brittle fallback to 'promotions' table for high engineering architecture.
          // In a proper system, failing to write an audit log should ping an alerting system, 
          // not pollute unrelated tables.
        }

        // Insert System Message for the Customer & Seller UI to see the update instantly
        try {
          const { data: dbOrderItems } = await getSupabase(req).from("order_items").select("product_id").eq("order_id", order.id).limit(1);
          let sellerId = "system";
          if (dbOrderItems && dbOrderItems.length > 0) {
             const { data: p } = await getSupabase(req).from("products").select("seller_id").eq("id", dbOrderItems[0].product_id).maybeSingle();
             if (p && p.seller_id) sellerId = p.seller_id;
          }

          const tasks = [];
          
          const shortId = order.id.substring(0, 8).toUpperCase();
          
          // Customer UI Notification
          if (dbOrder?.customer_id) {
             tasks.push(getSupabase(req).from("messages").insert([{
                id: ("MSG_SYS_" + Date.now() + Math.random().toString(36).substr(2, 5)).substring(0, 20),
                customer_id: dbOrder.customer_id,
                name: "SYSTEM ALERT",
                phone: "SYSTEM",
                message: `Order #${shortId} Status Update: Your order status changed from ${previousStatus} to ${order.status}.`,
                is_read: false,
                created_at: new Date().toISOString()
             }]));
          }
          
          // Seller UI Notification
          if (sellerId !== "system") {
             tasks.push(getSupabase(req).from("messages").insert([{
                id: ("MSG_SEL_" + Date.now() + Math.random().toString(36).substr(2, 5)).substring(0, 20),
                customer_id: null,
                name: "SYSTEM ALERT",
                phone: "SYSTEM",
                message: `Order Update #${shortId}: Order moved to ${order.status}.`,
                is_read: false,
                created_at: new Date().toISOString()
             }]));
          }
          
          await Promise.allSettled(tasks);
        } catch(e) {}
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/orders error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/orders/:id - Retrieve single order
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const buildQuery = (client: any) => {
      let q = client.from('orders').select(`*, items:order_items(*)`);
      if (isUuid) {
        q = q.or(`id.eq.${id},legacy_id.eq.${id}`);
      } else if (id.length >= 4) {
        q = q.or(`id.ilike.${id}%,legacy_id.ilike.%${id}%`);
      } else {
        q = q.ilike('legacy_id', `%${id}%`);
      }
      return q.limit(1);
    };

    let fetchRes = await buildQuery(getSupabase(req));
    if (fetchRes.error) throw fetchRes.error;
    const data = fetchRes.data;
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const decryptedData = decryptObject(data);
    const o = decryptedData[0];
    
    const parsed = parseDBRecord(o);

    const item = {
      id: o.id,
      items: o.items.map((i: any) => ({
        id: i.product_id,
        productId: i.product_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        category: '',
        stock: 0,
        images: [] 
      })),
      total: o.total,
      status: parsed.status,
      paymentStatus: parsed.paymentStatus,
      customerId: o.customer_id,
      customer_id: o.customer_id,
      customer: {
        name: o.customer_name,
        phone: o.customer_phone,
        address: o.customer_address
      },
      customerDetails: {
        name: o.customer_name,
        phone: o.customer_phone,
        address: o.customer_address
      },
      date: new Date(o.created_at).getTime(),
      paymentMethod: o.payment_method,
      paymentMethodName: o.payment_method_name,
      paymentReference: parsed.paymentReference,
      riderName: o.rider_name || undefined,
      riderPhone: o.rider_phone || undefined,
      riderVehicle: o.rider_vehicle || undefined
    };

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GET /api/v1/orders/:id error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/orders/:id/logs - Retrieve audit status change logs for an order
router.get("/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Attempt custom order logs table first
    const { data, error } = await getSupabase(req)
      .from('order_status_logs')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const mapped = data.map((log: any) => ({
        id: log.id,
        orderId: log.order_id,
        previousStatus: log.previous_status,
        newStatus: log.new_status,
        staffName: log.staff_name,
        staffEmail: log.staff_email,
        createdAt: new Date(log.created_at).getTime()
      }));
      return res.json({ success: true, data: mapped });
    }

    // Fallback: Fetch from promotions Table
    const fallbackTitle = `ORDER_LOGS_${id}`;
    const { data: promoData } = await supabase
      .from('promotions')
      .select('*')
      .eq('title', fallbackTitle)
      .maybeSingle();

    if (promoData && promoData.description) {
      try {
        const logsList = JSON.parse(promoData.description);
        const mapped = logsList.map((log: any) => ({
          id: log.id,
          orderId: log.order_id,
          previousStatus: log.previous_status,
          newStatus: log.new_status,
          staffName: log.staff_name,
          staffEmail: log.staff_email,
          createdAt: new Date(log.created_at).getTime()
        }));
        return res.json({ success: true, data: mapped });
      } catch {
        // Safe skip fallback parse error
      }
    }

    res.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("GET /api/v1/orders/:id/logs error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/orders/:id - Remove order from historical records (Soft delete using is_archived due to RLS)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Try actual delete first
    let resObj = await getSupabase(req).from('orders').delete().eq('id', id).select();
    if (resObj.error) {
      console.warn(`[Orders API] User client delete failed. Retrying with service-role admin access...`);
      resObj = await supabase.from('orders').delete().eq('id', id).select();
    }
    let { data, error, count } = resObj;
    
    // If RLS prevented hard deletion, fallback to soft deletion
    if (count === null || count === 0) {
      let softDeleteInfo = await getSupabase(req).from('orders').update({ is_archived: true }).eq('id', id).select();
      if (softDeleteInfo.error) {
        console.warn(`[Orders API] User client soft-delete failed. Retrying with service-role admin access...`);
        softDeleteInfo = await supabase.from('orders').update({ is_archived: true }).eq('id', id).select();
      }
      error = softDeleteInfo.error;
      count = softDeleteInfo.data?.length || 0;
      data = softDeleteInfo.data;
    }

    if (error) throw error;
    res.json({ success: true, count, data });

  } catch (error: any) {
    console.error("DELETE /api/v1/orders/:id error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

export default router;

import { Router } from "express";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/messages - Retrieve message board items
router.get("/", async (req, res) => {
  try {
    const { data, error } = await getSupabase(req).from('messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      message: m.message,
      date: new Date(m.created_at).getTime(),
      customerId: m.customer_id || (m.phone === "SYSTEM" ? "00000000-0000-0000-0000-000000000000" : null),
      adminReply: m.admin_reply,
      isRead: m.is_read
    }));

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/v1/messages error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/messages - Submit or reply to a customer session message
router.post("/", async (req, res) => {
  try {
    const msg = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let targetCustomerId = (msg.customerId && uuidRegex.test(msg.customerId)) ? msg.customerId : null;
    if (targetCustomerId === "00000000-0000-0000-0000-000000000000") {
      targetCustomerId = null;
    }

    const isReadVal = msg.isRead !== undefined ? msg.isRead : (msg.is_read !== undefined ? msg.is_read : false);
    const payload = {
      name: msg.name,
      phone: msg.phone,
      message: msg.message,
      customer_id: targetCustomerId,
      admin_reply: msg.adminReply || null,
      is_read: isReadVal,
      legacy_id: msg.id
    };

    let result;
    let existingMsg = null;

    if (msg.id) {
      if (uuidRegex.test(msg.id)) {
        const { data } = await getSupabase(req).from('messages').select('id').eq('id', msg.id).maybeSingle();
        if (data) existingMsg = data;
      } else {
        const { data } = await getSupabase(req).from('messages').select('id').eq('legacy_id', msg.id).maybeSingle();
        if (data) existingMsg = data;
      }
    }

    if (existingMsg) {
      result = await getSupabase(req).from('messages').update(payload).eq('id', existingMsg.id);
    } else {
      result = await getSupabase(req).from('messages').insert([payload]);
    }

    if (result.error) throw result.error;

    // Dispatch automatic confirmation for merchant applications
    const textMsg = msg.message || "";
    if (textMsg.includes("Maombi ya Kuwa Muuzaji")) {
      let matchedEmail = "";
      const lines = textMsg.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().includes("barua pepe:")) {
          matchedEmail = line.split(/barua pepe:/i)[1]?.trim() || "";
        }
      }
      
      const applicantName = msg.name || "Mpendwa Muuzaji";
      const applicantPhone = msg.phone;
      
      try {
        const { sendOrbiTalkDirectSMS, sendOrbiTalkDirectEmail } = await import("./talk.js");
        const requestId = `seller_ack_${Date.now()}`;
        
        const emailSubject = "Ombi Lako la Muuzaji Limepokelewa / Seller Application Received - Orbi Shop";
        
        const swMessage = `Habari ${applicantName},\n\nAsante kwa kutuma ombi lako la kuwa muuzaji kwenye mfumo wa Orbi Shop! Taarifa zako zote zimepokelewa kikamilifu kulingana na sera dhabiti za biashara yetu.\n\nIdara yetu ya usajili inashughulikia ombi lako na itakutafuta ndani ya saa 24 kwa ajili ya usajili kamili na kukupatia maelekezo ya akaunti yako.\n\nUshirikiano wako unathaminiwa sana!\n\nAsante,\nOrbi Shop Merchant Board`;
        
        const enMessage = `Dear ${applicantName},\n\nThank you for submitting your merchant registration on Orbi Shop! Your records have been received in accordance with our stringent platform standards and policies.\n\nOur onboarding team is actively reviewing your application. We will contact you within 24 hours to complete your verification and hand over your portal credentials.\n\nThank you for choosing to do business with Orbi Shop!\n\nBest regards,\nOrbi Shop Merchant Board`;
        
        const combinedBody = `${swMessage}\n\n====================\n\n${enMessage}`;

        if (applicantPhone) {
          const cleanPhone = applicantPhone.trim().replace(/\s+/g, "");
          console.log(`[SELLER REGISTRATION ACK] Dispatching auto-response SMS to ${cleanPhone}`);
          await sendOrbiTalkDirectSMS({
            recipient: cleanPhone,
            body: combinedBody,
            requestId
          }).catch(smsErr => console.error("Error dispatching seller application SMS ack:", smsErr));
        }
        
        if (matchedEmail && matchedEmail.includes("@")) {
          console.log(`[SELLER REGISTRATION ACK] Dispatching auto-response Email to ${matchedEmail}`);
          await sendOrbiTalkDirectEmail({
            recipient: matchedEmail.trim(),
            subject: emailSubject,
            body: combinedBody,
            requestId,
            ownerEmail: "sellers@orbifinancial.com",
            senderName: "Orbi Shop"
          }).catch(emailErr => console.error("Error dispatching seller application Email ack:", emailErr));
        }
      } catch (evtErr) {
        console.error("Error during automated seller receipt notification dispatch:", evtErr);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/messages error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/messages/:id - Erase chat log ticket from database
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getSupabase(req).from('messages').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/v1/messages/:id error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

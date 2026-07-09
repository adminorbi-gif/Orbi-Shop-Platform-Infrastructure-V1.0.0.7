import { Router } from "express";
// Route: Chat System
import { getAdminSupabase, getSupabase } from "../lib/supabase.js";
import { checkOffPlatformPayment } from "../lib/security.js";
import { clearCachedValue, sendResilientJson, withTimeout } from "../lib/apiResilience.js";

const router = Router();
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getDb = (req: any) => {
    return getAdminSupabase();
};

const safeErrorMessage = (error: any) => {
  const message = error?.message || String(error || "Unknown chat service error");
  return message.length > 240 ? `${message.slice(0, 240)}...` : message;
};

// GET /api/v1/chat/conversations
router.get("/conversations", async (req, res) => {
  try {
    // Ideally this would filter by user (req.user from auth token or provided in query for now)
    const { userId, role } = req.query;
    
    // Using AdminSupabase for broad queries here
    const db = getDb(req);
    
    // In a real DB we would query Conversations where participants array contains the user
    // For now we'll fetch all and filter or let frontend filter (simpler mock fallback)
    const { data, error } = await db.from('conversations').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const conversations = (data || []).map((c: any) => ({
      id: c.id,
      participants: c.participants ? (typeof c.participants === 'string' ? JSON.parse(c.participants) : c.participants) : [],
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      createdAt: c.created_at,
      unreadCount: c.unread_count ? (typeof c.unread_count === 'string' ? JSON.parse(c.unread_count) : c.unread_count) : {}
    }));

    // Simple manual filter if needed
    const filtered = conversations.filter((c: any) => {
      if (!userId) return true;
      if (role === 'admin') return true; // admin sees all
      return c.participants.some((p: any) => p.id === userId);
    });

    res.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error("GET /api/v1/chat/conversations error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Conversations could not be loaded." });
  }
});

// GET /api/v1/chat/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb(req);
    
    const { data, error } = await db
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('timestamp', { ascending: true });
        
    if (error) throw error;

    const messages = (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderRole: m.sender_role,
      content: m.content,
      timestamp: m.timestamp,
      isRead: m.is_read,
      senderName: m.sender_name
    }));

    res.json({ success: true, data: messages });
  } catch (error: any) {
    console.error("GET /api/v1/chat/messages error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Messages could not be loaded." });
  }
});

// POST /api/v1/chat/conversations/:id/messages
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const msg = req.body;
    
    // Block guest/ghost users from sending any chat messages
    if (!msg.senderId || msg.senderId.startsWith("guest") || msg.senderId === "guest") {
        return res.status(403).json({ success: false, error: "Only registered and active accounts are allowed to send messages." });
    }

    const db = getDb(req);
    
    const timestamp = Date.now();
    let processedContent = msg.content;
    let systemWarning = null;

    // Check if the conversation is a support chat (with admin)
    const { data: convData } = await db.from('conversations').select('participants').eq('id', id).single();
    let isSupportChat = false;
    if (convData && convData.participants) {
        const participants = typeof convData.participants === 'string' ? JSON.parse(convData.participants) : convData.participants;
        isSupportChat = participants.some((p: any) => p.id === "00000000-0000-0000-0000-000000000001" || p.id === "admin" || p.id === "official" || p.id === "support");
    }

    if (!isSupportChat) {

    // 🛡️ SECURITY SCAN: Detect "Urgent Payment" Scams (off-platform payment attempts)
        // The security check is now fully handled inside `checkOffPlatformPayment`
        const sensitiveRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]*){9,14}/g;
        processedContent = processedContent.replace(sensitiveRegex, "[REDACTED_NUMBER]");
    
        // If payment keywords are present, also redact any sequences of 4 or more digits
        const paymentKeywordsList = [
            "lipa", "tuma", "jina", "pesa", "namba", "bank", "account", "number",
            "mpesa", "m-pesa", "voda", "vodacom", "airtel", "money", "pay", "send",
            "halotel", "halopesa", "tigo", "tigopesa", "airtelmoney", "crdb", "nmb", "nbc",
            "paybill", "till", "merchant"
        ];
        const lowerContent = processedContent.toLowerCase();
        const hasPaymentKeyword = paymentKeywordsList.some(kw => lowerContent.includes(kw));
        if (hasPaymentKeyword) {
            const generalNumberRegex = /\d[\d\s-]{3,15}\d/g;
            processedContent = processedContent.replace(generalNumberRegex, "[REDACTED_NUMBER]");
        }
        
        // Globally check for security violations on every message
    
        const io = req.app.get("io");
        const userLang = msg.lang === "sw" ? "sw" : "en";
        const securityStatus = await checkOffPlatformPayment(msg.content, msg.senderId, msg.senderRole, io, userLang);
        
        if (securityStatus.frozen) {
            return res.status(403).json({ 
                success: false, 
                error: userLang === "sw"
                  ? "Akaunti imefungiwa kwa sababu ya ukiukaji wa usalama. Tafadhali subiri kurejeshwa kiotomatiki au wasiliana na msimamizi."
                  : "Account locked due to security violations. Please wait for auto-activation or contact admin." 
            });
        }
        
        if (securityStatus.flagged) {
            const warningContent = userLang === "sw"
                ? (msg.senderRole === "seller"
                    ? `⚠️ ONYO LA USALAMA (${securityStatus.newFlags}/3): Malipo ya nje ya mfumo hayaruhusiwi kabisa. Kuuza moja kwa moja kupitia njia binafsi kunaepuka ulinzi wa dhamana (escrow) wa Orbi PaySafe, jambo ambalo linaweza kusababisha upotevu wa fedha. Akaunti yako itafungiwa baada ya ukiukaji mara 3.`
                    : `⚠️ ONYO LA USALAMA (${securityStatus.newFlags}/5): Malipo ya nje ya mfumo hayaruhusiwi kabisa. Kulipa moja kwa moja kupitia namba binafsi kunaepuka ulinzi wa dhamana (escrow) wa Orbi PaySafe, kumaanisha kwamba hatuwezi kukulinda au kukurudishia fedha ikiwa utatapeliwa. Akaunti yako itafungiwa baada ya ukiukaji mara 5.`)
                : (msg.senderRole === "seller" 
                    ? `⚠️ SECURITY WARNING (${securityStatus.newFlags}/3): Off-platform payments are strictly prohibited. Selling directly via private channels bypasses Orbi PaySafe escrow protection, which could lead to loss of funds. Your account will be banned after 3 violations.`
                    : `⚠️ SECURITY WARNING (${securityStatus.newFlags}/5): Off-platform payments are strictly prohibited. Paying directly via private numbers bypasses Orbi PaySafe escrow protection, meaning we cannot protect you or refund you if you are scammed. Your account will be banned after 5 violations.`);
    
            systemWarning = {
                id: `sys-${Date.now()}`,
                conversation_id: id,
                sender_id: "system",
                sender_role: "admin",
                content: warningContent,
                timestamp: timestamp + 1,
                is_read: false,
                sender_name: "Orbi Security"
            };
        }
        
    }

    const payload = {
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversation_id: id,
        sender_id: msg.senderId,
        sender_role: msg.senderRole,
        content: processedContent, // Use the redacted content
        timestamp: timestamp,
        is_read: false,
        sender_name: msg.senderName
    };

    const payloadsToInsert = [payload];
    if (systemWarning) {
        payloadsToInsert.push(systemWarning);
    }

    const { error } = await db.from('chat_messages').insert(payloadsToInsert);
    if (error) throw error;

    // Update conversation lastMessage
    const convPayload = {
        last_message: processedContent, // Use processed content
        last_message_at: timestamp
    };
    await db.from('conversations').update(convPayload).eq('id', id);

    // Notify the other participant via Orbi Talk
    try {
        const { data: convData } = await db.from('conversations').select('participants').eq('id', id).single();
        if (convData && convData.participants) {
            const participants = typeof convData.participants === 'string' ? JSON.parse(convData.participants) : convData.participants;
            
            // Determine who to notify
            let otherParticipant = participants.find((p: any) => p.id !== msg.senderId);

            // SPECIAL CASE: If AI/System is talking to a customer about a transfer or support, 
            // we should notify the SELLER or ADMIN about this event, not the customer themselves.
            const isAICommunication = msg.senderId === "system" || msg.senderId === "ai-agent" || msg.senderId === "official";
            const isTransferContent = processedContent.includes("kuunganishwa") || 
                processedContent.includes("transfer") || 
                processedContent.includes("support") || 
                processedContent.includes("Nimekuhamisha") || 
                processedContent.includes("Live Agent") || 
                processedContent.includes("Mhudumu");

            if (isAICommunication && isTransferContent) {
                // Find the seller or admin in the conversation to notify them instead of the customer receiving the AI message
                const sellerPart = participants.find((p: any) => p.role === 'seller');
                const adminPart = participants.find((p: any) => p.role === 'admin' || p.id === "00000000-0000-0000-0000-000000000001");
                
                // Prioritize notifying the Admin or Seller about the transfer request
                if (adminPart) {
                    otherParticipant = adminPart;
                } else if (sellerPart) {
                    otherParticipant = sellerPart;
                }
            }
            
            if (otherParticipant && otherParticipant.id) {
                let recipientEmail = "";
                let recipientPhone = "";
                let isAdminRecipient = false;

                let businessName = "Valued Partner"; // Default fallback

                if (
                    otherParticipant.id === "admin" ||
                    otherParticipant.id === "official" ||
                    otherParticipant.id === "00000000-0000-0000-0000-000000000001" ||
                    otherParticipant.role === "admin" ||
                    otherParticipant.role === "official"
                ) {
                    isAdminRecipient = true;
                    businessName = "Orbi Shop"; // Specific greeting for Admin

                    // CRITICAL: Prevent sending standard customer chat messages as support tickets/notifications to Admin.
                    // We ONLY notify the Admin if it's an explicit transfer message, or if a transfer has been triggered (e.g. limit exceeded),
                    // or if the customer has already been handed over to a Live Agent (i.e. msg.askStaffAgent or msg.transferToLiveAgent is true).
                    if (isTransferContent || msg.transferToLiveAgent || msg.askStaffAgent) {
                        recipientEmail = process.env.ORBI_SHOP_TALK_OWNER_EMAIL || "shop@orbifinancial.com";
                        // Admin SMS fallback
                        recipientPhone = process.env.ORBI_SHOP_TALK_OWNER_PHONE || "+255764258114";
                    } else {
                        console.log(`[CHAT-NOTIFY] Skipping Admin notification/ticket for standard customer message (Non-transfer)`);
                    }
                } else {
                    // CRITICAL: Prevent sending standard customer chat messages as support tickets/notifications to Sellers.
                    // We ONLY notify the Seller if it's an explicit transfer message, or if a transfer has been triggered,
                    // or if the customer has already been handed over to a Live Agent (i.e. msg.askStaffAgent or msg.transferToLiveAgent is true).
                    if (isTransferContent || msg.transferToLiveAgent || msg.askStaffAgent) {
                        const targetTableName = otherParticipant.role === 'seller' ? 'sellers' : 'customers';
                        const selectFields = otherParticipant.role === 'seller' ? 'email, invoice_phone, phone, name' : 'email, phone, name';
                        const { data: targetUser } = await db.from(targetTableName).select(selectFields).or(`id.eq.${otherParticipant.id},legacy_id.eq.${otherParticipant.id}`).maybeSingle();
                        
                        if (targetUser) {
                            recipientEmail = targetUser.email || "";
                            // For sellers, fallback to primary phone if invoice_phone is empty
                            recipientPhone = otherParticipant.role === 'seller' 
                                ? (targetUser.invoice_phone || targetUser.phone) 
                                : targetUser.phone;
                            
                            if (targetUser.name) {
                                businessName = targetUser.name;
                            } else if (otherParticipant.role === 'customer') {
                                businessName = "Mteja Thamaniwa";
                            }
                        }
                    } else {
                        console.log(`[CHAT-NOTIFY] Skipping Seller/Customer notification for standard message (Non-transfer)`);
                    }
                }
                
                if (recipientEmail || recipientPhone) {
                    const { sendOrbiTalkTemplate } = await import("./talk.js");
                    
                    let trueCustomerName = msg.senderName || "Mteja";
                    if (isAICommunication) {
                        const customerPart = participants.find((p: any) => p.role === 'customer');
                        if (customerPart && customerPart.name) {
                            trueCustomerName = customerPart.name;
                        }
                    }

                    const templateData = {
                        businessName: businessName,
                        customerName: trueCustomerName,
                        messageSnippet: processedContent.length > 100 ? `${processedContent.slice(0, 100)}...` : processedContent
                    };

                    // Choose template based on recipient role and message type
                    let templateName = "AI_AGENT_TRANSFER";
                    if (isAdminRecipient) {
                        templateName = "NEW_SUPPORT_TICKET";
                    } else if (otherParticipant.role === 'customer') {
                        // If we are notifying a customer, we might want a different template eventually
                        templateName = "AI_AGENT_TRANSFER"; // Reuse for now or add CUSTOMER_NOTIFICATION
                    }

                    if (recipientEmail) {
                        console.log(`[CHAT-NOTIFY] Sending templated email to ${recipientEmail} using ${templateName}`);
                        await sendOrbiTalkTemplate({
                            templateName: templateName,
                            recipient: recipientEmail,
                            channel: "email",
                            language: "sw", 
                            requestId: `chat-email-${id}-${Date.now()}`,
                            data: templateData
                        });
                    }
                    
                    if (recipientPhone) {
                        console.log(`[CHAT-NOTIFY] Sending templated SMS to ${recipientPhone} using ${templateName}`);
                        await sendOrbiTalkTemplate({
                            templateName: templateName,
                            recipient: recipientPhone,
                            channel: "sms",
                            language: "sw",
                            requestId: `chat-sms-${id}-${Date.now()}`,
                            data: templateData
                        });
                    }
                }
            }
        }
    } catch (notifyErr) {
        console.error("Failed to send Orbi Talk chat notification:", notifyErr);
    }

    res.json({ 
        success: true, 
        data: { ...payload, conversationId: payload.conversation_id, senderId: payload.sender_id, senderRole: payload.sender_role, isRead: payload.is_read, senderName: payload.sender_name },
        warning: systemWarning ? { ...systemWarning, conversationId: systemWarning.conversation_id, senderId: systemWarning.sender_id, senderRole: systemWarning.sender_role, isRead: systemWarning.is_read, senderName: systemWarning.sender_name } : undefined
    });
  } catch (error: any) {
    console.error("POST /api/v1/chat/messages error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Message could not be saved." });
  }
});

// POST /api/v1/chat/conversations
router.post("/conversations", async (req, res) => {
    try {
        const { participants } = req.body;
        
        // Reject conversation creation if any participant is a guest
        const hasGuest = (participants || []).some((p: any) => !p.id || String(p.id).startsWith("guest") || p.id === "guest");
        if (hasGuest) {
            return res.status(403).json({ success: false, error: "Conversations cannot be created with guest participants." });
        }

        const db = getDb(req);
        let existingConv = null;

        const incomingIds = (participants || []).map((p: any) => {
            let id = p.id;
            if (id === "official" || id === "admin" || id === "support") {
                id = "00000000-0000-0000-0000-000000000001";
            }
            return id;
        }).sort();

        // 2. DB conversations
        const { data: dbConvs, error: queryErr } = await db.from('conversations').select('*');
        if (queryErr) throw queryErr;
        
        const found = dbConvs.find((c: any) => {
            const convParts = c.participants ? (typeof c.participants === 'string' ? JSON.parse(c.participants) : c.participants) : [];
            const ids = convParts.map((p: any) => {
                let id = p.id;
                if (id === "official" || id === "admin" || id === "support") {
                    id = "00000000-0000-0000-0000-000000000001";
                }
                return id;
            }).sort();
            return JSON.stringify(ids) === JSON.stringify(incomingIds);
        });
        
        if (found) {
            existingConv = {
                id: found.id,
                participants: typeof found.participants === 'string' ? JSON.parse(found.participants) : found.participants,
                createdAt: found.created_at,
                lastMessage: found.last_message,
                lastMessageAt: found.last_message_at,
                unreadCount: found.unread_count ? (typeof found.unread_count === 'string' ? JSON.parse(found.unread_count) : found.unread_count) : {}
            };
        }

        if (existingConv) {
            return res.json({ success: true, data: existingConv });
        }
        
        // Ensure standard structure
        const convId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const payload = {
            id: convId,
            participants: JSON.stringify(participants),
            created_at: Date.now()
        };
        
        const { error } = await db.from('conversations').insert([payload]);
        if (error) throw error;
        
        res.json({ success: true, data: {
            id: payload.id,
            participants: participants,
            createdAt: payload.created_at
        }});
    } catch (error: any) {
        console.error("POST /api/v1/chat/conversations error:", safeErrorMessage(error));
        res.status(503).json({ success: false, error: "Conversation could not be created." });
    }
});


// POST /api/v1/chat/conversations/:id/mark-read
router.post("/conversations/:id/mark-read", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const db = getDb(req);
    
    // In a real app we only mark messages where sender_id != userId
    const { error } = await db.from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/chat/mark-read error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Messages could not be marked as read." });
  }
});

// DELETE /api/v1/chat/conversations/:id/messages
router.delete("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb(req);

    // 1. Delete all messages from 'chat_messages' table in Postgres/Supabase
    const { error: deleteErr } = await db
      .from('chat_messages')
      .delete()
      .eq('conversation_id', id);

    if (deleteErr) throw deleteErr;

    // 2. Delete the conversation itself so it is removed from the sidebar
    const { error: deleteConvErr } = await db
      .from('conversations')
      .delete()
      .eq('id', id);

    if (deleteConvErr) throw deleteConvErr;

    // 3. Emit socket event if WebSocket is connected
    const io = req.app.get("io");
    if (io) {
      io.to(`conv_${id}`).emit("messagesDeleted", { conversationId: id });
    }

    res.json({ success: true, message: "History cleared successfully." });
  } catch (error: any) {
    console.error("DELETE /api/v1/chat/conversations/:id/messages error:", safeErrorMessage(error));
    res.status(503).json({ success: false, error: "Messages could not be deleted." });
  }
});

export default router;

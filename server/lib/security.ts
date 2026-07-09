import { getAdminSupabase } from "../lib/supabase.js";
import { sendOrbiTalkDirectSMS, sendOrbiTalkDirectEmail } from "../routes/talk.js";

// In-memory registry to track security violations for guests, unregistered users, or edge cases where user profile is missing in the database
const guestSecurityMap = new Map<string, { security_flags: number; status: string }>();

export async function checkOffPlatformPayment(
  message: string,
  senderId: string,
  senderRole: string,
  io?: any,
  lang?: string
): Promise<{ frozen: boolean; flagged: boolean; block_count: number; newFlags: number }> {
  // 1. Check for standard phone numbers (9 to 14 digits, possibly with spaces, hyphens, plus sign)
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]*){9,14}/g;
  const hasPhoneNumber = phoneRegex.test(message);
  
  // Reset regex index
  phoneRegex.lastIndex = 0;

  // 2. Comprehensive payment & utility keywords including Tanzanian mobile networks and banks
  const paymentKeywords = [
    "lipa", "tuma", "jina", "pesa", "namba", "bank", "account", "number",
    "mpesa", "m-pesa", "voda", "vodacom", "airtel", "money", "pay", "send",
    "halotel", "halopesa", "tigo", "tigopesa", "airtelmoney", "crdb", "nmb", "nbc",
    "paybill", "till", "merchant"
  ];
  
  const normalizedMessage = message.toLowerCase();
  
  // Create a de-spaced, de-punctuated message to detect spaced-out or decorated bypasses 
  // (e.g. "l i p a", "l.i.p.a", "2 4 6 6 3 7", "2.4.6.6.3.7")
  const despacedMessage = normalizedMessage.replace(/[\s.\-_/*~,]+/g, "");
  
  // Check if any payment keyword exists in either the normalized message or the de-spaced message
  const hasPaymentKeyword = paymentKeywords.some(keyword => 
    normalizedMessage.includes(keyword) || despacedMessage.includes(keyword)
  );
  
  // Check for any sequence of 4 or more digits in the original message
  const generalNumberRegex = /\d[\d\s-]{3,15}\d/;
  const hasDigitsOriginal = generalNumberRegex.test(normalizedMessage);

  // Check for continuous digit sequences in the de-spaced version:
  // a) Any continuous block of 8+ digits in de-spaced message (unconditional phone/account number bypass)
  const hasLongDigitsDespaced = /\d{8,20}/.test(despacedMessage);

  // b) Any continuous block of 4+ digits in de-spaced message (when paired with a payment keyword)
  const hasDigitsDespaced = /\d{4,20}/.test(despacedMessage);

  // If a standard phone number is detected, OR if there's a long sequence of de-spaced digits (8+),
  // OR if a payment keyword matches alongside any continuous digit sequence (4+), we flag it.
  const isOffPlatform = 
    hasPhoneNumber || 
    hasLongDigitsDespaced || 
    (hasPaymentKeyword && (hasDigitsOriginal || hasDigitsDespaced));

  const db = getAdminSupabase();
  const tableName = senderRole === "seller" ? "sellers" : "customers";

  let userRecord: { id?: string; security_flags: number; status: string } | null = null;
  const isGuest = !senderId || senderId === "guest" || senderId.startsWith("guest-") || senderId === "";
  let isFromDb = false;

  if (isGuest) {
    const guestKey = senderId || "anonymous-guest";
    if (!guestSecurityMap.has(guestKey)) {
      guestSecurityMap.set(guestKey, { security_flags: 0, status: "active" });
    }
    userRecord = guestSecurityMap.get(guestKey) || null;
  } else {
    const selectFields = senderRole === "seller" 
      ? "id, security_flags, status, email, name, invoice_phone, phone, invoice_email, last_security_flag_at"
      : "id, security_flags, status, email, phone, name, last_security_flag_at";

    // 1. Query database using legacy_id first
    const { data: user } = await db
      .from(tableName)
      .select(selectFields)
      .eq("legacy_id", senderId)
      .maybeSingle();

    if (user) {
      userRecord = user;
      isFromDb = true;
    } else {
      // 2. Query database using id, but ONLY if senderId is a valid UUID to avoid Postgres cast errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(senderId)) {
        const { data: userById } = await db
          .from(tableName)
          .select(selectFields)
          .eq("id", senderId)
          .maybeSingle();
        if (userById) {
          userRecord = userById;
          isFromDb = true;
        }
      }
    }

    // Fallback: If not found in DB (e.g. stale or deleted ID), treat as an in-memory guest
    if (!isFromDb) {
      const guestKey = senderId || "anonymous-guest";
      if (!guestSecurityMap.has(guestKey)) {
        guestSecurityMap.set(guestKey, { security_flags: 0, status: "active" });
      }
      userRecord = guestSecurityMap.get(guestKey) || null;
    }
  }

  // If the message is clean (no off-platform payment info)
  if (!isOffPlatform) {
    let currentFlags = userRecord?.security_flags || 0;
    if (userRecord && (userRecord as any).last_security_flag_at) {
      const lastFlag = new Date((userRecord as any).last_security_flag_at).getTime();
      const now = Date.now();
      const hours24 = 24 * 60 * 60 * 1000;
      if (now - lastFlag > hours24) {
        currentFlags = 0; // Effectively 0 for the UI since 24h elapsed
      }
    }
    const isFrozen = userRecord?.status === "frozen";
    return { frozen: isFrozen, flagged: false, block_count: currentFlags, newFlags: currentFlags };
  }

  // If message violates policy but user record doesn't exist anywhere yet, initialize a temporary record in-memory
  if (!userRecord) {
    const tempKey = senderId || "anonymous-guest";
    console.warn(`[Security Check] User record not found for senderId: ${senderId}. Initializing temp in-memory track.`);
    guestSecurityMap.set(tempKey, { security_flags: 0, status: "active" });
    userRecord = guestSecurityMap.get(tempKey) || null;
  }

  let currentFlags = userRecord?.security_flags || 0;
  
  if (userRecord && (userRecord as any).last_security_flag_at) {
    const lastFlag = new Date((userRecord as any).last_security_flag_at).getTime();
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;
    if (now - lastFlag > hours24) {
      currentFlags = 0; // Reset flags after 24h
    }
  }

  // 1. If the user is ALREADY frozen/blocked, immediately reject any message sending
  if (userRecord?.status === "frozen") {
    return { frozen: true, flagged: false, block_count: currentFlags, newFlags: currentFlags };
  }

  // 2. Message violates policy: increment security flags and freeze if limit exceeded
  const maxFlags = senderRole === "seller" ? 3 : 5;
  const newFlags = currentFlags + 1;
  const shouldFreeze = newFlags >= maxFlags;

  const updateData: any = { 
    security_flags: newFlags,
    last_security_flag_at: new Date().toISOString(),
    block_reason: 'Off-platform payment attempt'
  };

  if (shouldFreeze) {
    updateData.status = 'frozen';
  }

  if (isFromDb && userRecord && userRecord.id) {
    // Perform robust database update using the exact UUID primary key we successfully fetched
    const { error: updateError } = await db
      .from(tableName)
      .update(updateData)
      .eq("id", userRecord.id);

    if (updateError) {
      console.error(`[Security Check] Error updating security flags for user ${userRecord.id}:`, updateError);
    }
  } else {
    // Update temporary in-memory map for guests, unregistered users, or missing database rows
    const guestKey = senderId || "anonymous-guest";
    guestSecurityMap.set(guestKey, {
      security_flags: newFlags,
      status: shouldFreeze ? "frozen" : "active"
    });
  }
  
  if (shouldFreeze) {
    if (io) {
      const defaultEnMessage = senderRole === "seller"
        ? "Your merchant account has been locked/frozen due to multiple security violations. Please contact admin."
        : "Your customer account has been locked/frozen due to multiple security violations. Please contact admin.";
      const swMessage = senderRole === "seller"
        ? "Akaunti yako ya mfanyabiashara imefungiwa kutokana na ukiukaji mwingi wa usalama. Tafadhali wasiliana na msimamizi."
        : "Akaunti yako ya mteja imefungiwa kutokana na ukiukaji mwingi wa usalama. Tafadhali wasiliana na msimamizi.";

      io.to(senderId).emit("accountLocked", { 
        reason: 'Off-platform payment attempt',
        message: lang === "sw" ? swMessage : defaultEnMessage
      });
    }

    if (isFromDb && userRecord) {
      const recipientEmail = (senderRole === "seller" ? (userRecord as any).invoice_email || (userRecord as any).email : (userRecord as any).email) || "";
      const recipientPhone = (senderRole === "seller" ? ((userRecord as any).invoice_phone || (userRecord as any).phone) : (userRecord as any).phone) || "";
      const recipientName = (userRecord as any).name || (senderRole === "seller" ? "Merchant" : "Customer");
      const reqId = `sys-block-${senderId}-${Date.now()}`;

      // Dispatch direct SMS notification
      if (recipientPhone) {
        const smsBody = senderRole === "seller"
          ? `Orbi Shop: Akaunti yako ya muuzaji "${recipientName}" imefungwa kutokana na ukiukaji wa usalama. Your store has been frozen due to security violations.`
          : `Orbi Shop: Akaunti yako imefungwa kutokana na ukiukaji mwingi wa usalama wa Orbi PaySafe. Your account has been frozen due to security violations.`;

        sendOrbiTalkDirectSMS({
          recipient: recipientPhone,
          body: smsBody,
          requestId: reqId
        }).then(r => console.log(`[Security Block] SMS alert sent to ${recipientPhone}:`, r))
          .catch(err => console.error(`[Security Block] Failed to send SMS alert:`, err.message));
      }

      // Dispatch direct Email notification
      if (recipientEmail) {
        const subject = senderRole === "seller"
          ? `Akaunti ya Muuzaji Imefungiwa / Merchant Account Locked - ${recipientName}`
          : `Akaunti Yako ya Orbi Shop Imefungiwa / Your Orbi Shop Account is Locked`;

        const emailBody = senderRole === "seller"
          ? `Mpendwa Muuzaji ${recipientName},\n\nAkaunti yako ya duka imefungiwa kutokana na ukiukaji mwingi wa usalama wa Orbi PaySafe. Ulipokea maonyo ya hapo awali kuhusu kuelekeza wateja kulipia nje ya mfumo wetu mtawalia.\n\nIli kulinda usalama wa wateja na kuhakikisha huduma bora ya Orbi PaySafe, huduma za duka lako zimesitishwa mara moja.\n\nTafadhali wasiliana na Meneja wa Orbi Shop kurejesha duka lako.\n\n---\n\nDear Merchant ${recipientName},\n\nYour merchant store account has been locked due to multiple security violations of Orbi PaySafe rules. You received previous warnings about directing customers to pay off-platform.\n\nTo protect our customer ecosystem and ensure secure transactions via Orbi PaySafe, your store access has been frozen immediately.\n\nPlease contact your Orbi Shop Account Manager or Administrator to resolve this.\n\nAsante kwa ushirikiano wako / Thank you for your cooperation!`
          : `Mpendwa ${recipientName},\n\nAkaunti yako imefungwa kutokana na ukiukaji wa usalama. Mfumo wetu umebaini majaribio mengi ya kufanya malipo ya nje ya mfumo, ambayo inakiuka sera za Orbi PaySafe za kuzuia utapeli.\n\nIli kulinda usalama wa fedha zako, akaunti yako imezuiwa.\n\nKama una maswali au unataka kuwezesha tena akaunti yako, tafadhali wasiliana na huduma kwa wateja kwa msaada@orbifinancial.com.\n\n---\n\nDear ${recipientName},\n\nYour account has been locked due to security violations. Our system detected multiple attempts to arrange off-platform payments, which violates the Orbi PaySafe security policy designed to prevent scams.\n\nTo safeguard your funds and transaction security, your account has been frozen.\n\nIf you have any questions or wish to appeal this action, please contact support at msaada@orbifinancial.com.\n\nAsante kwa kuchagua Orbi Shop / Thank you for choosing Orbi Shop!`;

        sendOrbiTalkDirectEmail({
          recipient: recipientEmail,
          subject,
          body: emailBody,
          requestId: reqId,
          senderName: "Orbi PaySafe Security",
          senderEmail: "support@orbifinancial.com"
        }).then(r => console.log(`[Security Block] Email alert sent to ${recipientEmail}:`, r))
          .catch(err => console.error(`[Security Block] Failed to send Email alert:`, err.message));
      }
    }
  }
  
  return { 
    frozen: shouldFreeze, 
    flagged: true, 
    block_count: newFlags,
    newFlags: newFlags
  };
}

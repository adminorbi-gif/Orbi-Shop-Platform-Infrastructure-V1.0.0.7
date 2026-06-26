import { Router } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

/**
 * Persists success and failure events of Orbi Talk notification channels in promotions database table.
 */
const logsQueue: any[] = [];
let isFlushingLogs = false;

async function flushTalkLogs() {
  if (isFlushingLogs || logsQueue.length === 0) return;
  isFlushingLogs = true;
  
  try {
    const filePath = join(process.cwd(), "external", "talk", "talk_logs.json");
    let logsList: any[] = [];
    
    // 1. Load existing from local JSON file
    try {
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, "utf-8");
        logsList = JSON.parse(fileContent);
      }
    } catch (e) {
      console.warn("[ORBI-TALK-LOGS] Local JSON parsed failed, resetting logs list:", e);
    }

    if (!Array.isArray(logsList)) {
      logsList = [];
    }

    // Drain the queue
    const eventsToProcess = logsQueue.splice(0, logsQueue.length);
    logsList.unshift(...eventsToProcess.reverse());

    // 3. Keep list trimmed to limit memory footprint
    const trimmedLogs = logsList.slice(0, 200);

    // 4. Persist to local JSON file
    try {
      if (!existsSync(join(process.cwd(), "external", "talk"))) {
        const fs = await import("fs");
        fs.mkdirSync(join(process.cwd(), "external", "talk"), { recursive: true });
      }
      writeFileSync(filePath, JSON.stringify(trimmedLogs, null, 2), "utf-8");
    } catch (fsErr: any) {
      // Ignored
    }

    // 5. Try to optionally sync with the promotions database table, ignoring silent RLS errors
    try {
      const { data: promoData } = await supabase
        .from('promotions')
        .select('*')
        .eq('title', 'SYSTEM_TALK_LOGS')
        .maybeSingle();

      const payload = {
        title: 'SYSTEM_TALK_LOGS',
        description: JSON.stringify(trimmedLogs),
        visible: false
      };

      if (promoData && promoData.id) {
        await supabase.from('promotions').update(payload).eq('id', promoData.id);
      } else {
        await supabase.from('promotions').insert([payload]);
      }
    } catch (dbErr) {
    }
  } catch (err: any) {
    console.error("[ORBI-TALK-LOGS] Failed to flush channeling logs:", err.message);
  } finally {
    isFlushingLogs = false;
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(flushTalkLogs, 5000);
}

export async function saveTalkLog(log: {
  templateName: string;
  recipient: string;
  channel: "email" | "sms";
  language: "sw" | "en";
  requestId: string;
  status: "success" | "failed" | "simulated";
  error?: string;
  data?: any;
}) {
  try {
    const timestamp = new Date().toISOString();
    const newEntry = {
      id: log.requestId || `log-${Math.random().toString(36).substring(2, 11)}`,
      timestamp,
      templateName: log.templateName,
      recipient: log.recipient,
      channel: log.channel,
      language: log.language,
      status: log.status,
      error: log.error || null,
      data: log.data || null
    };

    logsQueue.unshift(newEntry);
  } catch (err: any) {
    console.error("[ORBI-TALK-LOGS] Failed to queue channeling log:", err.message);
  }
}

/**
 * Dynamically retrieves the correct template based on templateName and language preference, with automatic fallback handling.
 */
export function getMessage(templateName: string, language: string) {
  try {
    const filePath = join(process.cwd(), "external", "talk", "orbi_talk_templates.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    const templatesList = parsed.templates || [];

    const normName = templateName.toUpperCase();
    const targetLang = (language || "sw").toLowerCase();

    // 1. Precise Match: Look for exact matches for the specified language
    const langMatches = templatesList.filter(
      (t: any) => t.name === normName && t.language?.toLowerCase() === targetLang
    );

    if (langMatches.length > 0) {
      const email = langMatches.find((t: any) => t.channel === "email");
      const sms = langMatches.find((t: any) => t.channel === "sms");
      return {
        email: email || null,
        sms: sms || null,
        templates: langMatches,
        found: true,
        languageUsed: targetLang
      };
    }

    // 2. Fallback Swahili: If no exact language match, default to Swahili ('sw')
    const fallbackSwMatches = templatesList.filter(
      (t: any) => t.name === normName && t.language?.toLowerCase() === "sw"
    );

    if (fallbackSwMatches.length > 0) {
      const email = fallbackSwMatches.find((t: any) => t.channel === "email");
      const sms = fallbackSwMatches.find((t: any) => t.channel === "sms");
      return {
        email: email || null,
        sms: sms || null,
        templates: fallbackSwMatches,
        found: true,
        languageUsed: "sw"
      };
    }

    // 3. Fallback English: If neither is found, fallback to English ('en')
    const fallbackEnMatches = templatesList.filter(
      (t: any) => t.name === normName && t.language?.toLowerCase() === "en"
    );

    if (fallbackEnMatches.length > 0) {
      const email = fallbackEnMatches.find((t: any) => t.channel === "email");
      const sms = fallbackEnMatches.find((t: any) => t.channel === "sms");
      return {
        email: email || null,
        sms: sms || null,
        templates: fallbackEnMatches,
        found: true,
        languageUsed: "en"
      };
    }

    // 4. Any language: Match solely on name as an absolute fallback
    const anyMatches = templatesList.filter((t: any) => t.name === normName);
    if (anyMatches.length > 0) {
      const email = anyMatches.find((t: any) => t.channel === "email");
      const sms = anyMatches.find((t: any) => t.channel === "sms");
      return {
        email: email || null,
        sms: sms || null,
        templates: anyMatches,
        found: true,
        languageUsed: anyMatches[0].language || "sw"
      };
    }

    return {
      email: null,
      sms: null,
      templates: [],
      found: false,
      languageUsed: targetLang
    };
  } catch (error: any) {
    console.error(`[getMessage] Error reading template for ${templateName}:`, error.message);
    return {
      email: null,
      sms: null,
      templates: [],
      found: false,
      languageUsed: language,
      error: error.message
    };
  }
}

// In-memory record keeping for OTP verification
const otpMap = new Map<string, { code: string; expires: number }>();

/**
 * Reusable helper to send templated emails or SMS through the Orbi Talk Gateway with full variable expansion,
 * retry capability, and security guidelines.
 */
export async function sendOrbiTalkTemplate(params: {
  templateName: string;
  recipient: string;
  channel: "email" | "sms";
  language: "sw" | "en";
  requestId: string;
  data: Record<string, string>;
  brand?: {
    code?: string;
    displayName?: string;
    senderEmail?: string;
    source?: string;
    logoUrl?: string;
  };
  attachments?: Array<{
    filename: string;
    content: string; // Base64 or URL content
    contentType?: string;
  }>;
}) {
  const gatewayUrl = (process.env.ORBI_TALK_GATEWAY_URL || "https://talk.orbifinancial.com").replace(/\/$/, "");
  const apiKey = process.env.ORBI_SHOP_TALK_API_KEY;
  const ownerUid = process.env.ORBI_SHOP_TALK_OWNER_UID || "ORBI_SHOP_OWNER_UID";
  
  // Use explicit brand senderEmail, environment variable, or fallback
  let ownerEmail = params.brand?.senderEmail || process.env.ORBI_SHOP_TALK_OWNER_EMAIL || "shop@orbifinancial.com";

  // Establish senderEmail based on template target per developer guidelines
  const upperName = params.templateName.toUpperCase();
  if (upperName.includes("DISPUTE")) {
    ownerEmail = "support@orbifinancial.com";
  } else if (upperName.includes("BUYER") || upperName.includes("OFFERS")) {
    ownerEmail = "offers@orbifinancial.com";
  } else if (upperName.includes("SELLER") || upperName.includes("MERCHANT")) {
    ownerEmail = "sellers@orbifinancial.com";
  } else {
    // For order, escrow, delivery, and refund messages
    ownerEmail = "shop@orbifinancial.com";
  }

  // Derive messageType from template definition if present
  let mType = "transactional";
  const tInfo = getMessage(params.templateName, params.language);
  if (tInfo && tInfo.found) {
    const matchedT = tInfo.templates[0];
    if (matchedT && matchedT.messageType) {
      mType = matchedT.messageType;
    }
  }

  // Fallback check to ensure mType matches promotional for campaigns
  if (upperName.includes("PROMO") || upperName.includes("CAMPAIGN")) {
    mType = "promotional";
  }

  // Expand payload to maximum variables to prevent rendering failures
  const expandedData = {
    businessName: params.brand?.displayName || params.data.businessName || "ORBI Shop",
    customerName: params.data.customerName || params.data.recipientName || "Daniel",
    recipientName: params.data.recipientName || params.data.customerName || "Daniel",
    sellerName: params.data.sellerName || "Muuzaji",
    orderId: params.data.orderId || "10001",
    currency: params.data.currency || "TZS",
    amount: params.data.amount || "0",
    refId: params.data.refId || params.data.orderId || `SHOP-${params.data.orderId || "10001"}`,
    actionLink: params.data.actionLink || "https://orbi.shop",
    logoUrl: params.brand?.logoUrl || "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png",
    ...params.data
  };

  const brandPayload = {
    code: params.brand?.code || "ORBI_SHOP",
    displayName: params.brand?.displayName || expandedData.businessName || "ORBI Shop",
    senderEmail: ownerEmail,
    source: params.brand?.source || "merchant",
    logoUrl: params.brand?.logoUrl || "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
  };

  if (!apiKey) {
    console.warn("[ORBI-TALK] API KEY is missing. Real template message dispatch will be simulated.");
    await saveTalkLog({
      templateName: params.templateName,
      recipient: params.recipient,
      channel: params.channel,
      language: params.language,
      requestId: params.requestId,
      status: "simulated",
      error: "Talk API Key is empty (Simulated)",
      data: expandedData
    });
    return { success: true, simulated: true, message: "Talk API Key is empty" };
  }

  const payload: any = {
    templateName: params.templateName,
    recipient: params.recipient,
    channel: params.channel,
    language: params.language,
    messageType: mType,
    ownerUid,
    requestId: params.requestId,
    brand: brandPayload,
    data: expandedData
  };

  if (params.attachments && Array.isArray(params.attachments)) {
    payload.attachments = params.attachments;
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError = "";
  let res: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`[ORBI-TALK] Template ${params.templateName} dispatch attempt ${attempt} using ID: ${params.requestId}`);
      res = await fetch(`${gatewayUrl}/api/send-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch (e) {}

      if (res.ok) {
        console.log(`[ORBI-TALK-GATEWAY] Template ${params.templateName} dispatched successfully on attempt ${attempt}:`, json);
        await saveTalkLog({
          templateName: params.templateName,
          recipient: params.recipient,
          channel: params.channel,
          language: params.language,
          requestId: params.requestId,
          status: "success",
          data: expandedData
        });
        return { success: true, data: json };
      }

      lastError = `HTTP ${res.status}: ${text}`;
      console.error(`[ORBI-TALK-GATEWAY ERROR] Attempt ${attempt} returned status ${res.status}. Body: ${text}`);

      // Auto-retry on 5xx network gateways errors. No retry on 4xx user validation errors.
      if (res.status >= 500) {
        if (attempt < maxAttempts) {
          const backoff = 1000 * attempt;
          console.warn(`[ORBI-TALK-RETRY] Encountered server error. Backing off for ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      } else {
        break; // break early for client-side errors (400, 401, 403, 404)
      }
    } catch (err: any) {
      lastError = err.message;
      console.error(`[ORBI-TALK-GATEWAY FETCH FAILURE] Attempt ${attempt} crashed: ${err.message}`);
      if (attempt < maxAttempts) {
        const backoff = 1000 * attempt;
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  // Persist delivery failures to log registry
  await saveTalkLog({
    templateName: params.templateName,
    recipient: params.recipient,
    channel: params.channel,
    language: params.language,
    requestId: params.requestId,
    status: "failed",
    error: lastError,
    data: expandedData
  });

  return { success: false, error: lastError };
}

/**
 * Reusable helper to send direct custom operational communications (like OTPs)
 */
export async function sendOrbiTalkDirectSMS(params: {
  recipient: string;
  body: string;
  requestId: string;
}) {
  const gatewayUrl = (process.env.ORBI_TALK_GATEWAY_URL || "https://talk.orbifinancial.com").replace(/\/$/, "");
  const apiKey = process.env.ORBI_SHOP_TALK_API_KEY;
  const ownerUid = process.env.ORBI_SHOP_TALK_OWNER_UID || "";
  const ownerEmail = process.env.ORBI_SHOP_TALK_OWNER_EMAIL || "shop@orbifinancial.com";

  if (!apiKey) {
    console.warn("[ORBI-TALK] API KEY is missing. Direct custom SMS message will be simulated.");
    await saveTalkLog({
      templateName: "DIRECT_SMS_OTP",
      recipient: params.recipient,
      channel: "sms",
      language: "sw",
      requestId: params.requestId,
      status: "simulated",
      error: "Talk API Key is empty (Simulated)",
      data: { body: params.body }
    });
    return { success: true, simulated: true, message: "Talk API Key is empty" };
  }

  const payload = {
    recipient: params.recipient,
    body: params.body,
    channel: "sms",
    messageType: "transactional",
    ownerUid,
    ownerEmail,
    requestId: params.requestId
  };

  // Direct target endpoint for SMS custom gateway routing configuration
  const ep = "/api/send-sms";
  let lastError = "";

  try {
    console.log(`[ORBI-TALK] Dispatching custom SMS to endpoint: ${ep}`);
    const res = await fetch(`${gatewayUrl}${ep}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    if (res.ok) {
      console.log(`[ORBI-TALK] Direct custom SMS sent successfully via ${ep}:`, text);
      await saveTalkLog({
        templateName: "DIRECT_SMS_OTP",
        recipient: params.recipient,
        channel: "sms",
        language: "sw",
        requestId: params.requestId,
        status: "success",
        data: { body: params.body, endpointUsed: ep, response: text }
      });
      return { success: true, data: text };
    } else {
      console.warn(`[ORBI-TALK-GATEWAY WARNING] Endpoint ${ep} returned ${res.status}: ${text}`);
      lastError = text;
    }
  } catch (err: any) {
    console.error(`[ORBI-TALK-GATEWAY FETCH FAILURE] Endpoint ${ep}:`, err.message);
    lastError = err.message;
  }

  await saveTalkLog({
    templateName: "DIRECT_SMS_OTP",
    recipient: params.recipient,
    channel: "sms",
    language: "sw",
    requestId: params.requestId,
    status: "failed",
    error: lastError,
    data: { body: params.body }
  });
  return { success: false, error: lastError };
}

/**
 * Reusable helper to send direct custom operational or promotional emails
 */
export async function sendOrbiTalkDirectEmail(params: {
  recipient: string;
  subject: string;
  body: string;
  requestId: string;
  ownerEmail?: string;
  senderEmail?: string;
  senderName?: string;
  messageType?: "transactional" | "promotional";
}) {
  const gatewayUrl = (process.env.ORBI_TALK_GATEWAY_URL || "https://talk.orbifinancial.com").replace(/\/$/, "");
  const apiKey = process.env.ORBI_SHOP_TALK_API_KEY;
  const ownerUid = process.env.ORBI_SHOP_TALK_OWNER_UID || "";
  
  // Decide the raw email address for the sender (prefer user explicit, else env, else context default)
  const defaultEmail = params.messageType === "promotional" ? "offers@orbifinancial.com" : "shop@orbifinancial.com";
  const ownerEmail = params.ownerEmail || params.senderEmail || process.env.ORBI_SHOP_TALK_OWNER_EMAIL || defaultEmail;
  
  const senderDisplayName = params.senderName || "Orbi Shop";
  const formattedFromEmail = `${senderDisplayName} <${ownerEmail}>`;

  if (!apiKey) {
    console.warn("[ORBI-TALK] API KEY is missing. Direct custom Email message will be simulated.");
    await saveTalkLog({
      templateName: "DIRECT_EMAIL_OTP",
      recipient: params.recipient,
      channel: "email",
      language: "en",
      requestId: params.requestId,
      status: "simulated",
      error: "Talk API Key is empty (Simulated)",
      data: { subject: params.subject, body: params.body }
    });
    return { success: true, simulated: true, message: "Talk API Key is empty" };
  }

  const payload = {
    recipient: params.recipient,
    subject: params.subject,
    body: params.body,
    channel: "email",
    messageType: params.messageType || "transactional",
    ownerUid,
    ownerEmail, // raw email address
    fromEmail: formattedFromEmail, // Orbi Shop <email>
    from: formattedFromEmail,
    sender: formattedFromEmail,
    senderEmail: ownerEmail,
    senderName: senderDisplayName,
    requestId: params.requestId,
    brand: {
      code: "ORBI_SHOP",
      displayName: senderDisplayName,
      senderEmail: ownerEmail,
      source: "merchant",
      logoUrl: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
    }
  };

  const ep = "/api/send-email";
  let lastError = "";

  try {
    console.log(`[ORBI-TALK] Dispatching custom Email to endpoint: ${ep}`);
    const res = await fetch(`${gatewayUrl}${ep}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    if (res.ok) {
      console.log(`[ORBI-TALK] Direct custom Email sent successfully via ${ep}:`, text);
      await saveTalkLog({
        templateName: "DIRECT_EMAIL_OTP",
        recipient: params.recipient,
        channel: "email",
        language: "en",
        requestId: params.requestId,
        status: "success",
        data: { subject: params.subject, body: params.body, endpointUsed: ep, response: text }
      });
      return { success: true, data: text };
    } else {
      console.warn(`[ORBI-TALK-GATEWAY WARNING] Endpoint ${ep} returned ${res.status}: ${text}`);
      lastError = text;
    }
  } catch (err: any) {
    console.error(`[ORBI-TALK-GATEWAY FETCH FAILURE] Endpoint ${ep}:`, err.message);
    lastError = err.message;
  }

  await saveTalkLog({
    templateName: "DIRECT_EMAIL_OTP",
    recipient: params.recipient,
    channel: "email",
    language: "en",
    requestId: params.requestId,
    status: "failed",
    error: lastError,
    data: { subject: params.subject, body: params.body }
  });
  return { success: false, error: lastError };
}

// POST /api/talk/send-otp - Dispatch secure SMS & Email OTP via Orbi Talk Gateway
router.post("/send-otp", async (req, res) => {
  const { phone, email } = req.body;
  if (!phone || phone.trim().length < 8) {
    return res.status(400).json({ success: false, error: "Please provide a valid phone number" });
  }

  try {
    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim() : "";
    // Generate secure 6-digit numeric OTP code
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    
    // Store in-memory with 5-minute expiry threshold
    otpMap.set(cleanPhone, {
      code: otpCode,
      expires: Date.now() + 5 * 60 * 1000
    });

    const isSwahili = cleanPhone.startsWith("+255") || cleanPhone.startsWith("255") || cleanPhone.startsWith("0");
    const swMessage = `Msimbo wako wa ulinzi wa ORBI Shop (OTP) ni: ${otpCode}. Tafadhali usimshirikishe mtu yeyote.`;
    const enMessage = `Your Orbi Shop verification code (OTP) is: ${otpCode}. Do not share this code with anyone.`;
    
    const smsBody = isSwahili ? swMessage : enMessage;
    const reqUniqueId = `otp-dispatch-${cleanPhone}-${Date.now()}`;

    console.log(`[OTP-ROUTING] Initiating real Orbi Talk Gateway SMS request for: ${cleanPhone}`);
    const result = await sendOrbiTalkDirectSMS({
      recipient: cleanPhone,
      body: smsBody,
      requestId: reqUniqueId
    });

    if (!result.success && !result.simulated) {
      return res.status(500).json({ success: false, error: result.error || "Talk Gateway SMS transmission failed" });
    }

    let emailDispatched = false;
    let emailStatusMessage = "";
    if (cleanEmail && cleanEmail.includes("@")) {
      const emailSubject = isSwahili ? "Msimbo wako wa siri wa Orbi Shop (OTP)" : "Your Orbi Shop Security Verification Code (OTP)";
      const emailBody = isSwahili
        ? `Habari,\n\nMsimbo wako wa siri wa kuhakiki akaunti yako ya Orbi Shop (OTP) ni:\n\n👉 **${otpCode}** 👈\n\nMsimbo huu utamalizika muda wake baada ya dakika 5. Tafadhali usimshirikishe mtu yeyote.\n\nAsante,\nTimu ya Ulinzi ya Orbi Shop`
        : `Hello,\n\nYour Orbi Shop security verification code (OTP) is:\n\n👉 **${otpCode}** 👈\n\nThis code will expire in 5 minutes. Please do not share it with anyone.\n\nBest regards,\nOrbi Shop Security Team`;

      const emailReqUniqueId = `otp-email-${cleanPhone}-${Date.now()}`;
      console.log(`[OTP-ROUTING] Initiating real Orbi Talk Gateway Email request for: ${cleanEmail}`);
      const emailResult = await sendOrbiTalkDirectEmail({
        recipient: cleanEmail,
        subject: emailSubject,
        body: emailBody,
        requestId: emailReqUniqueId,
        ownerEmail: "shop@orbifinancial.com",
        senderName: "Orbi Shop"
      });

      if (emailResult.success) {
        emailDispatched = true;
        emailStatusMessage = emailResult.simulated ? "Simulated Email Sent" : "Email Dispatched";
      }
    }

    // Include the simulated OTP directly in payload ONLY if API key is not configured for easy testing
    const responsePayload: any = {
      success: true,
      message: emailDispatched
        ? "OTP sent successfully via Orbi Talk Gateway SMS and Email."
        : "OTP sent successfully via Orbi Talk Gateway SMS.",
      emailSent: emailDispatched,
      emailStatus: emailStatusMessage
    };

    if (result.simulated) {
      responsePayload.simulated = true;
      responsePayload.debugCode = otpCode; // Backwards compatible simulated fallback
    }

    res.json(responsePayload);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
});

// POST /api/talk/verify-otp - Verify entered code matching stored state
router.post("/verify-otp", async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: "Missing phone number or verification code" });
  }

  const cleanPhone = phone.trim();
  const cleanCode = code.trim();

  const record = otpMap.get(cleanPhone);
  if (!record) {
    return res.status(400).json({ success: false, error: "No OTP request was found for this phone number." });
  }

  if (Date.now() > record.expires) {
    otpMap.delete(cleanPhone);
    return res.status(400).json({ success: false, error: "OTP has expired! Please request a new verification code." });
  }

  if (record.code !== cleanCode) {
    return res.status(400).json({ success: false, error: "The code you entered is incorrect. Please try again." });
  }

  // Verification succeeded - clear from map memory
  otpMap.delete(cleanPhone);
  res.json({ success: true, message: "Phone number verified successfully!" });
});

// GET /api/talk/logs - Retrieve the last 200 talk gateway delivery logs
router.get("/logs", async (req, res) => {
  try {
    const filePath = join(process.cwd(), "external", "talk", "talk_logs.json");
    let logsList = [];
    
    // 1. Try reading local JSON file
    try {
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, "utf-8");
        logsList = JSON.parse(fileContent);
      }
    } catch (fsErr: any) {
      console.warn("[ORBI-TALK-LOGS] Failed reading local logs file:", fsErr.message);
    }

    // 2. If empty or missing, fallback to Supabase promotion table
    if (!Array.isArray(logsList) || logsList.length === 0) {
      try {
        const { data: promoData } = await supabase
          .from('promotions')
          .select('*')
          .eq('title', 'SYSTEM_TALK_LOGS')
          .maybeSingle();

        if (promoData && promoData.description) {
          logsList = JSON.parse(promoData.description);
        }
      } catch (dbErr: any) {
        console.warn("[ORBI-TALK-LOGS] Failed querying fallback from DB:", dbErr.message);
      }
    }

    if (!Array.isArray(logsList)) {
      logsList = [];
    }

    res.json({ success: true, data: logsList });
  } catch (error: any) {
    console.error("GET /api/talk/logs error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/talk/logs/clear - Clear the talk gateway delivery logs
router.post("/logs/clear", async (req, res) => {
  try {
    const filePath = join(process.cwd(), "external", "talk", "talk_logs.json");
    
    // 1. Clear local file
    try {
      writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
    } catch (fsErr: any) {
      console.warn("[ORBI-TALK-LOGS] Local write of cleared list failed:", fsErr.message);
    }

    // 2. Clear or update DB row optionally
    try {
      const { data: promoData } = await supabase
        .from('promotions')
        .select('*')
        .eq('title', 'SYSTEM_TALK_LOGS')
        .maybeSingle();

      const payload = {
        title: 'SYSTEM_TALK_LOGS',
        description: JSON.stringify([]),
        visible: false
      };

      if (promoData && promoData.id) {
        await supabase.from('promotions').update(payload).eq('id', promoData.id);
      } else {
        await supabase.from('promotions').insert([payload]);
      }
    } catch (dbErr) {
      // Quietly allow failures on clear optional sync due to RLS
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/talk/logs/clear error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/talk/send-test-message - Direct gateway dispatch playground for testers & admins
router.post("/send-test-message", async (req, res) => {
  const { recipient, channel, subject, body } = req.body;
  if (!recipient || !channel || !body) {
    return res.status(400).json({ success: false, error: "Missing recipient, channel, or body info." });
  }

  const cleanRecipient = recipient.trim();
  const reqId = `test-direct-dispatch-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

  try {
    if (channel === "email") {
      const emailSubject = subject?.trim() || "Orbi Shop Gateway Test Alert";
      const result = await sendOrbiTalkDirectEmail({
        recipient: cleanRecipient,
        subject: emailSubject,
        body: body.trim(),
        requestId: reqId,
        ownerEmail: "shop@orbifinancial.com",
        senderName: "Orbi Shop"
      });
      return res.json({ success: true, ...result });
    } else if (channel === "sms") {
      const result = await sendOrbiTalkDirectSMS({
        recipient: cleanRecipient,
        body: body.trim(),
        requestId: reqId
      });
      return res.json({ success: true, ...result });
    } else {
      return res.status(400).json({ success: false, error: "Unsupported channel: must be 'email' or 'sms'." });
    }
  } catch (err: any) {
    console.error("POST /api/talk/send-test-message execution failed:", err.message);
    return res.status(500).json({ success: false, error: err.message || "An exception occurred dispatching custom gateway message." });
  }
});

// GET /api/talk/message - Dynamically retrieve matching message template based on templateName and language
router.get("/message", (req, res) => {
  const { templateName, language } = req.query;
  if (!templateName) {
    return res.status(400).json({ success: false, error: "Missing templateName query parameter" });
  }
  const result = getMessage(String(templateName), String(language || "sw"));
  res.json({ success: true, data: result });
});

// POST /api/talk/send-template - Secure proxy to dispatch templated email/SMS via Orbi Talk Gateway
router.post("/send-template", async (req, res) => {
  const reqApiKey = req.headers["x-api-key"] || req.headers["X-API-Key"] || req.query.apiKey;
  const orbiApiKey = process.env.ORBI_SHOP_TALK_API_KEY;
  if (orbiApiKey && reqApiKey !== orbiApiKey) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid x-api-key credentials." });
  }

  const { templateName, recipient, channel, language, data, brand, attachments, requestId } = req.body;
  if (!templateName || !recipient || !channel) {
    return res.status(400).json({ success: false, error: "Missing required fields: templateName, recipient, and channel are mandatory." });
  }

  const parsedLang = (language === "sw" || language === "en") ? language : "sw";
  const parsedChannel = (channel === "email" || channel === "sms") ? channel : "email";
  const parsedRequestId = requestId || `shop-proxy-${templateName.toLowerCase()}-${Date.now()}-${Math.floor(Math.random()*10000)}`;

  try {
    const result = await sendOrbiTalkTemplate({
      templateName,
      recipient,
      channel: parsedChannel,
      language: parsedLang,
      requestId: parsedRequestId,
      data: data || {},
      brand,
      attachments
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || "Gateway dispatch failed." });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("POST /api/talk/send-template controller crashed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

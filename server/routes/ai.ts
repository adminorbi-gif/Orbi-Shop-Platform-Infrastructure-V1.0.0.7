import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { getGeminiClient } from "../lib/gemini";
import { OrbiSecurityPolicy } from "../../src/engine/OrbiSecurityPolicy";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

// AI Bilingual Support & Recommendation Route (Multimodal Enabled)
router.post("/assistant", async (req, res) => {
  try {
    const { message, history = [], image, customer } = req.body;

    // Check if user is in SYSTEM_UNLOCKED_AI bypass list
    let isUnlockedByAgent = false;
    try {
      const { data: unlockedData } = await supabase
        .from('promotions')
        .select('description')
        .eq('title', 'SYSTEM_UNLOCKED_AI')
        .maybeSingle();
      if (unlockedData && unlockedData.description && customer?.id) {
        const list = JSON.parse(unlockedData.description);
        isUnlockedByAgent = list.includes(customer.id) || (customer.email && list.includes(customer.email));
      }
    } catch (e) {
      console.log("Error checking UNLOCKED AI system list:", e);
    }

    // Calculate total questions asked (user turns) in this conversation
    const userMessageCount = history.filter((item: any) => item.role === "user").length + 1;

    if (userMessageCount > 10 && !isUnlockedByAgent) {
      console.log(`[AI LIMIT EXCEEDED] User turn count ${userMessageCount} exceeds 10 questions limit. Migrating to live support agent.`);
      
      // Format the entire history details for the store representative
      const formattedHistory = history.map((chat: any) => {
        const roleLabel = chat.role === "user" ? "Mteja (User)" : "Orbi AI (Model)";
        return `[${roleLabel}]: ${chat.text}`;
      }).join("\n\n");

      const staffTicketMessage = `⚠️ [UHAMISHO WA AUTOMATIC: MASWALI 10 YA AI YAMEZIDI]
Mteja huyu amehudumiwa na AI na ameuliza jumla ya maswali ya mfululizo ${userMessageCount} ya mazungumzo (Kikomo cha maswali 10 cha AI kimefikiwa). Mfumo umemhamisha kwa Live Agent moja kwa moja.

Tafadhali, mhudumie mteja kwa haraka.

*** HISTORIA YA MAZUNGUMZO YA AI & MSIMBO: ***
${formattedHistory || "Hakuna historia iliyotangulia."}

*** SWALI LA MWISHO LA MTEJA: ***
${message || "Mteja ametuma picha pekee."}`;

      // Insert directly into 'messages' table to create a support ticket in admin inbox
      try {
        await supabase.from("messages").insert([{
          name: customer?.name || "Mteja wa AI (Guest)",
          phone: customer?.phone || "N/A",
          message: staffTicketMessage,
          customer_id: customer?.id || null,
          admin_reply: null,
          is_read: false
        }]);
        console.log(`[AI SUPPORT TICKET] Successfully auto-forwarded client transcripts to live staff messages inbox.`);
      } catch (dbErr: any) {
        console.error("Failed to insert auto-forward message to live agent inbox:", dbErr.message);
      }

      const replySw = `Nimefurahi sana kukusaidia! 😊 Kwa kuwa umeuliza maswali zaidi ya 10 ya usaidizi, nimekuhamisha moja kwa moja kwenda kwa **Live Agent (Wakala wetu wa duka)** ili upate msaada zaidi wa kina kutoka kwa mwanadamu.

Kurasa wetu wa mazungumzo na ujumbe wote umeshatumwa kwa wakala. Sasa hivi unaweza kuandika ujumbe wa ziada kwenye sehemu ya mawasiliano au profile yako na utajibiwa haraka na mfanyakazi wetu!`;

      const replyEn = `I have really enjoyed helping you! 😊 Since you have asked more than 10 support questions, I have auto-transferred you directly to a **Live Store Representative (Human Agent)** for highly specific, customized assistance.

All of our chat log transcripts are forwarded, and our staff will respond to you right away! If you need to send extra attachments or follow up, you can use our profile chat page.`;

      return res.json({
        success: true,
        reply: `${replySw}\n\n---\n\n${replyEn}`,
        transferToLiveAgent: true,
        userMessageCount
      });
    }

    // Query products from Supabase dynamically for live catalog lookup
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .limit(35);

    let productsCtx = "";
    if (dbProducts && dbProducts.length > 0) {
      productsCtx = dbProducts.map((p: any) => {
        return `ID: ${p.id}, Name: ${p.name}, Category: ${p.category || 'General'}, Price: TSh ${Number(p.price).toLocaleString()}, Desc: ${p.description || 'No description available.'}`;
      }).join("\n---\n");
    } else {
      productsCtx = "Suala hili ni jipya kabisa, bidhaa zitapakiwa hivi karibuni.";
    }

    const ai = getGeminiClient();

    // Formulate detailed system properties with vision analytics rules
    const systemInstruction = `You are "Orbi AI Assistant", a premium shop guide and customer support representative for Orbi Shop in Tanzania.
Your character is highly enthusiastic, incredibly professional, and billingual in Swahili and English. 
Always use Swahili (Kiswahili) or English relative to the customer's query.

Your primary capabilities:
1. Product Recommendation: Help customers search, compare, and recommend actual products from the current live inventory catalog provided below.
2. Image/Media Analysis: If the user provides an image or picture, analyze it with your vision capabilities. Try to identify what it is (type of item, style, color, pattern, specs, brand). Carefully compare it to the ACTIVE PRODUCTS IN STOCK list below. Recommend the closest matching or similar products from the catalog, detailing exactly why they correspond (e.g. "We have a similar shirt/phone/chair..."). Include their matching IDs, names, and prices clearly.
3. Pricing and Billing: Show item prices in TSh, suggest deals, explain available payments (like M-Pesa, Tigo Pesa, Orbi PaySafe, bank transfer).
4. Delivery & Carrier Logistics: Inform them they can pick up their orders from their chosen Pickup Points (Kariakoo, Mbezi terminal, Posta, Arusha hub, etc.) or get shipping estimates.
5. Support inquiries: Be helpful.

IMPORTANT SECURITY POLICY:
You must strictly follow and enforce the Orbi Security Policy below when answering any questions or handling transactions:
${OrbiSecurityPolicy.getGuidelinesForBot()}
Rules:
${OrbiSecurityPolicy.rules.map((r: any) => `- ${r.title}: ${r.description}`).join("\n")}

ACTIVE PRODUCTS IN STOCK:
${productsCtx}

Guidelines for responses:
- Strictly enforce the security policy above. Remind users to only pay inside the Orbi platform.
- Reference actual product names and prices from the roster above. If no match is found, say so politely.
- Keep answers formatted with concise bullet points, bold headers, and elegant structures using markdown.
- Treat prices strictly in Swahili/English formats.`;

    let userParts: any[] = [];
    
    // If we received an image, construct the inlineData block for Gemini
    if (image && image.data) {
      let base64Data = image.data;
      let mimeType = image.mimeType || "image/png";

      // Remove the data URI scheme prefix if present
      if (base64Data.includes(";base64,")) {
        const parts = base64Data.split(";base64,");
        mimeType = parts[0].replace("data:", "");
        base64Data = parts[1];
      }

      userParts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    userParts.push({ text: message || "Sema nini kipo kwenye picha hii na kupendekeza bidhaa zinazofanana." });

    const contents = [
      ...history.map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      })),
      { role: 'user', parts: userParts }
    ];

    const modelToUse = "gemini-3.5-flash";
    console.log(`[AI ASSISTANT] Routing request to free-tier model: ${modelToUse} (Has Image: ${!!image})`);

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      success: true,
      reply: response.text
    });
  } catch (err: any) {
    console.warn("Gemini Error:", err.message);
    res.json({
      success: false,
      reply: `Habari! Mimi ni Orbi Shop AI Assistant. 😊\n\nNiko hapa kukusaidia kuchagua bidhaa bora, kujibu maswali ya malipo kupitia Orbi Pay, au kuangalia vituo vya karibu vya mzigo (Store Locator)!\n\n*(Kumbuka: Huduma maalum ya AI inajiandaa, unaweza kuuliza maswali hapa kwangu na nitatumia katalogi yetu ili kukusaidia ipasavyo!)*`,
      error: err.message
    });
  }
});

// Agent Co-Pilot suggested draft generator (multilingual, inventory-aware)
router.post("/copilot-suggest", async (req, res) => {
  try {
    const { history = [], customerMessage, customInstruction } = req.body;
    const ai = getGeminiClient();

    // Query live inventory for recommendations
    const { data: dbProducts } = await supabase.from('products').select('*').limit(35);
    const productsCtx = (dbProducts || []).map((p: any) => {
      return `ID: ${p.id}, Name: ${p.name}, Price: TSh ${Number(p.price).toLocaleString()}, Category: ${p.category || 'General'}`;
    }).join("\n");

    let systemInstruction = `You are an expert sales and support administrative assistant at Orbi Shop.
Draft a highly helpful, extremely context-appropriate response to the customer in order to help them.
Be bilingual in Kiswahili and English as appropriate.
Review the history and the recent customer message. Feel free to suggest specific products from the inventory roster below if relevant. Provide pricing.
Do not sign with standard generic placeholders unless appropriate. Keep the output neat with clear markdown formatting.

CURRENT LIVE INVENTORY:
${productsCtx}`;

    if (customInstruction) {
      systemInstruction += `\n\nSPECIAL OPERATOR SPECIFIC REQUEST OR STYLING INSTRUCTION:\n${customInstruction}`;
    }

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: `Draft an optimal support response replying to the customer message: "${customerMessage}"` }] }
    ];

    const modelToUse = "gemini-3.5-flash";
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    res.json({ success: true, suggestion: response.text });
  } catch (error: any) {
    console.warn("Copilot Generation Error:", error.message);
    res.json({ success: false, suggestion: "Kisha fanya uchambuzi na ujibu mteja mpendwa. (Error creating co-pilot suggestion)" });
  }
});

// Generate product description using AI
router.post("/generate-description", async (req, res) => {
  try {
    const { name, niche, category, features } = req.body;
    const ai = getGeminiClient();

    const prompt = `Act as an expert eCommerce copywriter. Write a compelling, detailed product description for an item sold in Tanzania (Orbi Shop).
Product Name: ${name}
Niche: ${niche}
Category: ${category}
Features: ${features ? JSON.stringify(features) : "None provided"}

Write the description in a professional tone, blending English and Swahili gracefully if possible (or just mostly English with Swahili phrases). Focus on benefits to the user, the quality, and technical specifics if applicable. Keep it concise but persuasive (2-3 paragraphs). Do not include price.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ description: response.text });
  } catch (err: any) {
    console.error("AI Gen Error:", err.message);
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// Visual Receipt & Invoice Parser Node (Auto-Loyalty Credits & Digitizer)
router.post("/parse-receipt", async (req, res) => {
  try {
    const { image, customerId } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "Receipt base64 image required" });
    }

    const ai = getGeminiClient();

    let base64Data = image;
    let mimeType = "image/png";

    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Data = parts[1];
    }

    const systemInstruction = `You are a high-speed OCR agent designed to parse receipts and purchase orders.
Analyze the provided receipt/invoice image. Extract the vendor name, billing date, items purchased (name, quantity, unit price), and aggregate total.
Estimate the earned loyalty points of the transaction (calculate exactly 1 loyalty point per 2000 TSh spent, round down).
You MUST return ONLY a valid, parseable JSON object without any backticks, markdown markers, or other wrapper text.

JSON Schema:
{
  "vendor": "String",
  "date": "String",
  "items": [
    { "name": "String", "quantity": 1, "price": 0 }
  ],
  "total": 0,
  "estimatedLoyaltyPoints": 0
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Parse this receipt into JSON structure." }
          ]
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    let parsedData: any;
    try {
      parsedData = JSON.parse(response.text.trim());
    } catch (parseErr) {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid response format from Gemini: " + response.text);
      }
    }

    res.json({
      success: true,
      receipt: parsedData,
      message: "Receipt parsed successfully by Vision AI!"
    });
  } catch (error: any) {
    console.warn("Receipt parsing error:", error.message);
    res.json({
      success: false,
      error: error.message,
      reply: "Shida imetokea wakati wa kusoma picha ya risiti hiyo. (Receipt parsing issue)"
    });
  }
});

router.get("/unlocked-ai/list", async (req, res) => {
  try {
    const { data } = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_UNLOCKED_AI').maybeSingle();
    const list = data?.description ? JSON.parse(data.description) : [];
    res.json({ success: true, list });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

router.post("/unlocked-ai/toggle", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    const { data } = await supabase.from('promotions').select('id, description').eq('title', 'SYSTEM_UNLOCKED_AI').maybeSingle();
    let list = data?.description ? JSON.parse(data.description) : [];
    
    if (list.includes(customerId)) {
      list = list.filter((id: string) => id !== customerId);
    } else {
      list.push(customerId);
    }

    const payload = {
      title: 'SYSTEM_UNLOCKED_AI',
      description: JSON.stringify(list),
      visible: false
    };

    if (data && data.id) {
      await supabase.from('promotions').update(payload).eq('id', data.id);
    } else {
      await supabase.from('promotions').insert([payload]);
    }

    res.json({ success: true, list });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

router.post("/reset-quota", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    const { data } = await supabase.from('promotions').select('id, description').eq('title', 'SYSTEM_AI_RESET_TIMESTAMPS').maybeSingle();
    let timestamps = data?.description ? JSON.parse(data.description) : {};
    
    const now = Date.now();
    timestamps[customerId] = now;

    const payload = {
      title: 'SYSTEM_AI_RESET_TIMESTAMPS',
      description: JSON.stringify(timestamps),
      visible: false
    };

    if (data && data.id) {
      await supabase.from('promotions').update(payload).eq('id', data.id);
    } else {
      await supabase.from('promotions').insert([payload]);
    }

    res.json({ success: true, resetAt: now });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId required" });

    // Check reset quota timestamps
    const { data: resetData } = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_AI_RESET_TIMESTAMPS').maybeSingle();
    const timestamps = resetData?.description ? JSON.parse(resetData.description) : {};
    const resetAt = timestamps[customerId as string] || 0;

    // Check bypassed / unlocked lists
    const { data: unlockedData } = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_UNLOCKED_AI').maybeSingle();
    const list = unlockedData?.description ? JSON.parse(unlockedData.description) : [];
    const isUnlocked = list.includes(customerId as string);

    res.json({ success: true, resetAt, isUnlocked });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

export default router;

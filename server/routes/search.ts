import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { getGeminiClient } from "../lib/gemini";
import { BILINGUAL_DICTIONARY } from "../../src/lib/searchDictionary";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

const searchCache = new Map<string, string[]>();
let circuitBreakerActiveUntil = 0;

// Helper function for levenshtein & spelling mismatch
const getLevenshtein = (a: string, b: string): number => {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

const isSimilar = (w1: string, w2: string): boolean => {
  if (w1 === w2) return true;
  if (w1.length < 3 || w2.length < 3) return false;
  const dist = getLevenshtein(w1, w2);
  const maxLength = Math.max(w1.length, w2.length);
  let allowed = 1;
  if (maxLength >= 8) {
    allowed = 2; // tolerates 2 typos for longer words
  }
  return dist <= allowed;
};

router.get("/expand", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    if (!q) {
      return res.json({ success: true, keywords: [] });
    }

    // 1. Fast Cache Check
    if (searchCache.has(q)) {
      return res.json({ success: true, keywords: searchCache.get(q), source: "cache" });
    }

    // 2. Check local fast rule dictionary with spell-tolerance
    let fallbackKeywords = BILINGUAL_DICTIONARY[q];
    if (!fallbackKeywords) {
      for (const key of Object.keys(BILINGUAL_DICTIONARY)) {
        if (isSimilar(q, key)) {
          fallbackKeywords = BILINGUAL_DICTIONARY[key];
          break;
        }
      }
    }
    if (!fallbackKeywords) {
      fallbackKeywords = [q];
    }

    // 3. Circuit Breaker Check
    const now = Date.now();
    const isCircuitActive = now < circuitBreakerActiveUntil;
    if (isCircuitActive) {
      return res.json({ success: true, keywords: fallbackKeywords, source: "dictionary" });
    }

    // Try expanding with AI
    try {
      const ai = getGeminiClient();
      console.log(`[SEARCH EXPAND] Contacting Gemini for query: "${q}"`);
      
      const systemInstruction = `You are a high-speed, highly accurate bilingual (Swahili-English) search synonym expander for Orbi Shop, Tanzanian e-commerce.
Given a raw user query, expand it ONLY to closely related Swahili/English translations, synonyms, and singular/plural forms of that exact product type.

CRITICAL RULES:
- Never mix product categories.
- Do NOT include cooling/AC terms unless the user query is explicitly about air conditioning or fans.
- Keep the terms strictly focused on the direct Swahili or English synonyms.

Return ONLY a flat JSON string array of expanded lowercase keywords (maximum 8 key terms). No markdown blocks or code wrappers and no descriptions.
Format: ["keyword1", "keyword2", ...]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: `Expand query: "${q}"` }] }],
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const text = response.text.trim();
      let aiKeywords: string[] = JSON.parse(text);
      if (Array.isArray(aiKeywords) && aiKeywords.length > 0) {
        aiKeywords = aiKeywords.map(k => k.toLowerCase().trim());
        if (!aiKeywords.includes(q)) {
          aiKeywords.unshift(q);
        }
        searchCache.set(q, aiKeywords);
        return res.json({ success: true, keywords: aiKeywords, source: "ai" });
      }
    } catch (aiErr: any) {
      const errMsg = aiErr.message || "";
      const isQuotaErr = errMsg.includes("429") || errMsg.toLowerCase().includes("quota");
      
      if (isQuotaErr) {
        circuitBreakerActiveUntil = Date.now() + 5 * 60 * 1000;
        console.warn(`[SEARCH EXPAND WARNING] Rate limit exceeded. Serving dictionary for "${q}".`);
      }
    }

    return res.json({ success: true, keywords: fallbackKeywords, source: "dictionary" });
  } catch (err: any) {
    console.warn("Search Expand error:", err.message);
    res.json({ success: false, keywords: [req.query.q as string || ""], error: err.message });
  }
});

router.get("/popular", (req, res) => {
  try {
    // Seed with high-fidelity keywords
    const seeds = ["gesi", "kiyoyozi", "feni", "viatu", "shati", "simu", "raba", "gauni", "solari", "ac", "jiko", "baridi"];
    res.json({ success: true, popular: seeds.slice(0, 8) });
  } catch (err: any) {
    res.json({ success: false, popular: ["gesi", "kiyoyozi", "feni", "viatu", "shati", "simu", "ac"] });
  }
});

export default router;

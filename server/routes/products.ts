import { Router } from "express";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/products - Fetch all products
router.get("/", async (req, res) => {
  try {
    let selectRes = await getSupabase(req).from('products').select('*').order('created_at', { ascending: false });
    if (selectRes.error) throw selectRes.error;

    const data = selectRes.data;
    const mapped = (data || []).map(p => {
      const catRaw = typeof p.category === 'string' ? p.category : '';
      const parts = catRaw.split('::');
      const niche = parts.length > 0 ? parts[0] : 'Electronics';
      const category = parts.length > 1 ? parts[1] : '';
      const family = parts.length > 2 ? parts[2] : '';

      const tagsList = Array.isArray(p.tags) ? p.tags : [];
      const sellerTag = tagsList.find((t: string) => typeof t === 'string' && t.startsWith('seller_id:'));
      const parsedSellerId = p.seller_id || (sellerTag ? sellerTag.split(':')[1] : undefined);

      const skuTag = tagsList.find((t: string) => typeof t === 'string' && t.startsWith('sku:'));
      const parsedSku = skuTag ? skuTag.substring(4) : undefined;

      const warrantyTag = tagsList.find((t: string) => typeof t === 'string' && t.startsWith('warranty:'));
      const parsedWarranty = p.warranty || (warrantyTag ? warrantyTag.substring(9) : undefined);

      return {
        id: p.id,
        name: p.name || 'Unnamed',
        niche: niche,
        category: category,
        family: family,
        price: Number(p.price) || 0,
        oldPrice: p.old_price ? Number(p.old_price) : null,
        stock: Number(p.stock) || 0,
        description: p.description || '',
        tags: tagsList,
        images: Array.isArray(p.images) ? p.images : [],
        visible: Boolean(p.visible),
        createdAt: new Date(p.created_at || Date.now()).getTime(),
        sellerId: parsedSellerId,
        sku: parsedSku,
        warranty: parsedWarranty,
        features: Array.isArray(p.features) ? p.features : [],
        wholesaleTiers: Array.isArray(p.wholesale_tiers) ? p.wholesale_tiers : []
      };
    });

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/v1/products error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/products - Create/Update product
router.post("/", async (req, res) => {
  try {
    const product = req.body;

    const trySave = async (withVisible: boolean, useServiceRole = false) => {
      let finalTags = product.tags ? [...product.tags] : [];
      if (product.sellerId) {
        finalTags = finalTags.filter((t: string) => !t.startsWith('seller_id:'));
        finalTags.push(`seller_id:${product.sellerId}`);
      }
      if (product.sku) {
        finalTags = finalTags.filter((t: string) => !t.startsWith('sku:'));
        finalTags.push(`sku:${product.sku}`);
      }
      if (product.warranty) {
        finalTags = finalTags.filter((t: string) => !t.startsWith('warranty:'));
        finalTags.push(`warranty:${product.warranty}`);
      }

      const payload: any = {
        name: product.name,
        category: `${product.niche || 'Electronics'}::${product.category || ''}::${product.family || ''}`,
        price: product.price,
        old_price: product.oldPrice === undefined ? null : product.oldPrice,
        stock: product.stock,
        description: product.description,
        features: Array.isArray(product.features) ? product.features : [],
        wholesale_tiers: Array.isArray(product.wholesaleTiers) ? product.wholesaleTiers : [],
        tags: finalTags,
        images: product.images,
        legacy_id: product.id?.includes('-') ? product.id : undefined
      };
      if (withVisible) {
        payload.visible = product.visible;
      }

      const activeClient = useServiceRole ? supabase : getSupabase(req);

      if (product.id && !product.id.startsWith('PRD-') && product.id.length > 20) {
        return activeClient.from('products').update(payload).eq('id', product.id).select().single();
      } else {
        return activeClient.from('products').insert([payload]).select().single();
      }
    };

    let result = await trySave(true, false);
    if (result.error) {
      if (result.error.code === 'PGRST204') {
        result = await trySave(false, false);
      } else {
        console.warn(`[Products API] User client write failed with code ${result.error.code} (${result.error.message}). Retrying write with service-role admin access...`);
        result = await trySave(true, true);
        if (result.error && result.error.code === 'PGRST204') {
          result = await trySave(false, true);
        }
      }
    }

    if (result.error) throw result.error;
    res.json({ success: true, id: result.data.id });
  } catch (error: any) {
    console.error("POST /api/v1/products error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// DELETE /api/v1/products/:id - Delete continuous product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { error } = await getSupabase(req).from('products').delete().eq('id', id);
    if (error) {
      console.warn(`[Products API] User client delete failed: ${error.message}. Retrying with service-role admin access...`);
      const retry = await supabase.from('products').delete().eq('id', id);
      error = retry.error;
    }
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/v1/products/:id error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// DELETE /api/v1/products/niche/:niche - Delete products under target niche
router.delete("/niche/:niche", async (req, res) => {
  try {
    const { niche } = req.params;
    let { error } = await getSupabase(req).from('products').delete().like('category', `${niche}::%`);
    if (error) {
      console.warn(`[Products API] User client delete-by-niche failed: ${error.message}. Retrying with service-role admin access...`);
      const retry = await supabase.from('products').delete().like('category', `${niche}::%`);
      error = retry.error;
    }
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/v1/products/niche/:niche error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// UPDATE /api/v1/products/niche/rename - Rename niche in products
router.post("/niche/rename", async (req, res) => {
  try {
    const { oldNiche, newNiche } = req.body;
    if (!oldNiche || !newNiche) {
      return res.status(400).json({ success: false, error: "Missing oldNiche or newNiche" });
    }

    // Since Supabase doesn't have a direct string replace for update without SQL function,
    // we fetch all matching products, and update them.
    let fetchRes = await getSupabase(req).from('products').select('id, category').like('category', `${oldNiche}::%`);
    if (fetchRes.error) throw fetchRes.error;

    const products = fetchRes.data;
    if (products && products.length > 0) {
      for (const p of products) {
        let newCategoryStr = p.category;
        if (p.category && p.category.startsWith(`${oldNiche}::`)) {
          newCategoryStr = p.category.replace(`${oldNiche}::`, `${newNiche}::`);
          let { error: updateErr } = await getSupabase(req).from('products').update({ category: newCategoryStr }).eq('id', p.id);
          if (updateErr) throw updateErr;
        }
      }
    }

    res.json({ success: true, updatedCount: products?.length || 0 });
  } catch (error: any) {
    console.error("POST /api/v1/products/niche/rename error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// Import GoogleGenAI for e-commerce copywriting support
import { GoogleGenAI } from "@google/genai";

let aiClient: any = null;
function getGemini() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// POST /api/v1/products/ai-suggest-description - Suggest e-commerce copy via Gemini
router.post("/ai-suggest-description", async (req, res) => {
  try {
    const { name, category, niche, tags } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Product name is required for AI suggestions" });
    }

    const ai = getGemini();
    const prompt = `You are a professional e-commerce copywriter in Tanzania. Write a compelling, high-converting product description for:
- Product Name: ${name}
- Niche Scope: ${niche || "General"}
- Sub-category: ${category || "General"}
- Extra keywords/tags: ${tags ? tags.join(", ") : "None"}

Requirements:
1. Provide a beautiful bilingual layout: first a passionate block in friendly, engaging Swahili/Kiswahili, followed by an elegant block in English.
2. The description should detail its premium quality, utility, and appeal to Tanzanian shoppers.
3. Total word count should be around 100-150 words.
4. Format with clean line breaks so it looks professional in a store product detail box.
5. Use bullet points for key features if applicable.
6. Do not wrap code in any markdown backticks or extra json wrapper, just output the plain text description raw.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, description: response.text });
  } catch (error: any) {
    console.error("POST /api/v1/products/ai-suggest-description error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/products/ai-suggest-niche - Suggest niche and category based on name and description
router.post("/ai-suggest-niche", async (req, res) => {
  try {
    const { name, description, availableNiches } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Product name is required for Niche suggestions" });
    }

    const ai = getGemini();

    const formattedNiches = (availableNiches || []).map((n: any) => {
      const catsInfo = (n.categories || []).map((c: any) => {
        const catName = typeof c === 'string' ? c : c.name;
        const families = Array.isArray(c.families) ? c.families.join(", ") : "None";
        return `${catName} (Families: ${families})`;
      }).join("; ");
      return `${n.name} (Categories: ${catsInfo})`;
    }).join("\n");

    const prompt = `You are "Orbi AI", an expert product arrangement and e-commerce catalog optimizer.
Analyze this product:
- Product Title: "${name}"
- Product Description: "${description || 'No description provided'}"

Here are the store's currently configured Niches, Categories, and Families:
${formattedNiches || "None configured yet"}

Your goal:
1. Identify the absolute best Niche, Category, and Family match from the existing list above.
2. If absolutely none of the existing matches fit, suggest a highly accurate custom Niche, Category, and Family.
3. Recommend the most appropriate Arrangement Tier based on the price point and exclusivity:
   - "standard": Budget-friendly, basic or standard essential products.
   - "premium": High-quality, artistic, or premium Tier products.
   - "luxury": Extremely premium, royal or luxury high-end offerings.
   - "all": General/Not applicable.
4. Recommend the most appropriate Visual Vibe style:
   - "romance": Pink/Red roses, intimate/passionate items, love-themed or crimson items.
   - "serenity": Calm white, soft pastels, relaxing pink, peace-themed or serenity products.
   - "sunshine": Yellow/orange, warm energy, bright golden sunshine items.
   - "mystery": Indigo/purple/orchid, enchanting, mystery or unique creative packages.
   - "nature": Green, herbal, eco-friendly, fresh plants/nature theme.
   - "all": General/Not applicable.
5. Recommend the Packaging/Presentation Style:
   - "box": Premium Box / Boxi Maalum.
   - "wrap": Classic Wrap / Karatasi & Kanga.
   - "glass": Glass Vase / Chombo cha Kioo.
   - "basket": Rustic Basket / Kikapu.
   - "all": None or generic packaging.
6. Write a brief professional explanation of your choice in both Swahili (Kiswahili) and English so the administrator knows why this is recommended.

Respond with ONLY a raw, complete JSON object. Absolutely no markdown formatting, no \`\`\`json blocks, and no extra text wrapping. The JSON schema must be exactly:
{
  "suggestedNiche": "The name of the Niche",
  "suggestedCategory": "The name of the Category",
  "suggestedFamily": "The name of the Family/Sub-subcategory",
  "suggestedTier": "standard" | "premium" | "luxury" | "all",
  "suggestedVibe": "romance" | "serenity" | "sunshine" | "mystery" | "nature" | "all",
  "suggestedPresentation": "box" | "wrap" | "glass" | "basket" | "all",
  "reasonSwahili": "Maelezo mafupi kwanini umechagua kundi na mpangilio huu",
  "reasonEnglish": "A concise explanation of why you selected this classification and arrangement structure"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText.trim());
    } catch {
      // In case copy still has markdown wrappers despite prompt constraints
      const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleanJson);
    }

    res.json({ success: true, ...parsedResult });
  } catch (error: any) {
    console.error("POST /api/v1/products/ai-suggest-niche error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

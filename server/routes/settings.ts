import { Router } from "express";
import { supabase, getSupabase, encrypt, decrypt } from "../lib/supabase.js";
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();

// 1. INVOICE SETTINGS
router.get("/invoice", async (req, res) => {
  try {
    const { data } = await getSupabase(req).from('invoice_settings').select('*').eq('id', 1).maybeSingle();
    let payOpts: any[] = [];
    try {
      const { data: po } = await getSupabase(req).from('payment_options').select('*').eq('is_active', true);
      payOpts = po || [];
    } catch (e) {}

    let extraSettings: any = {};
    try {
      const { data: appSetData } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_APP_SETTINGS').maybeSingle();
      if (appSetData && appSetData.description) {
        extraSettings = JSON.parse(appSetData.description);
      }
    } catch (e) {}

    let portalData: any = null;
    try {
      const { data: ps } = await getSupabase(req).from('portal_settings').select('*').eq('id', 1).maybeSingle();
      portalData = ps;
    } catch (e) {}

    const details = {
      companyName: data ? decrypt(data.company_name) : "Orbi Shop",
      address: data ? decrypt(data.address) : "",
      phone: data ? decrypt(data.phone) : "+255764258114",
      email: data ? decrypt(data.email) : "shop@orbifinancial.com",
      terms: data ? decrypt(data.terms) : "",
      paymentOptions: (payOpts || []).map(po => ({
        ...po,
        name: decrypt(po.name),
        details: decrypt(po.details)
      })),
      appBarBackground: portalData && portalData.app_bar_background !== null ? portalData.app_bar_background : (data && data.app_bar_background !== null ? data.app_bar_background : (extraSettings.appBarBackground || "")),
      appBarBackground2: portalData && portalData.app_bar_background2 !== null ? portalData.app_bar_background2 : (data && data.app_bar_background2 !== null ? data.app_bar_background2 : (extraSettings.appBarBackground2 || "")),
      appBarBackground3: portalData && portalData.app_bar_background3 !== null ? portalData.app_bar_background3 : (data && data.app_bar_background3 !== null ? data.app_bar_background3 : (extraSettings.appBarBackground3 || "")),
      disableAppBarAnimations: portalData && portalData.disable_app_bar_animations !== null ? portalData.disable_app_bar_animations : (data && data.disable_app_bar_animations !== null ? data.disable_app_bar_animations : (extraSettings.disableAppBarAnimations || false)),
      ...extraSettings
    };

    if (details.email === "" || details.email.includes("689919994")) details.email = "shop@orbifinancial.com";
    if (details.phone === "" || details.phone.includes("689919994")) details.phone = "+255764258114";

    res.json({ success: true, data: details });
  } catch (error: any) {
    console.error("GET /api/v1/settings/invoice error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/invoice", async (req, res) => {
  try {
    const settings = req.body;
    await getSupabase(req).from('invoice_settings').upsert({
      id: 1,
      company_name: encrypt(settings.companyName),
      address: encrypt(settings.address),
      phone: encrypt(settings.phone),
      email: encrypt(settings.email),
      terms: encrypt(settings.terms)
    });

    try {
      await getSupabase(req).from('portal_settings').upsert({
        id: 1,
        app_bar_background: settings.appBarBackground || "",
        app_bar_background2: settings.appBarBackground2 || "",
        app_bar_background3: settings.appBarBackground3 || "",
        disable_app_bar_animations: !!settings.disableAppBarAnimations,
        app_bar_color: settings.appBarColor || ""
      });
    } catch (portalErr) {
      console.warn("Could not write portal_settings table:", portalErr);
    }

    try {
      await getSupabase(req).from('payment_options').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      if (settings.paymentOptions && settings.paymentOptions.length > 0) {
        const payOps = settings.paymentOptions.map((po: any) => ({
          name: encrypt(po.name),
          details: encrypt(po.details),
          is_active: true
        }));
        await getSupabase(req).from('payment_options').insert(payOps);
      }
    } catch (optErr) {
      console.warn("Could not write payment_options table:", optErr);
    }

    try {
      const extraSettings = {
        pointsRate: settings.pointsRate,
        pointsWorth: settings.pointsWorth,
        pointsRequiredPerTzsDiscount: settings.pointsRequiredPerTzsDiscount,
        v_5k_cost: settings.v_5k_cost,
        v_15_vip_cost: settings.v_15_vip_cost,
        v_free_ship_cost: settings.v_free_ship_cost,
        appBarBackground: settings.appBarBackground,
        appBarBackground2: settings.appBarBackground2,
        appBarBackground3: settings.appBarBackground3,
        appBarColor: settings.appBarColor,
        disableAppBarAnimations: !!settings.disableAppBarAnimations,
      };
      
      const { data: existAppSet } = await getSupabase(req).from('promotions').select('id').eq('title', 'SYSTEM_APP_SETTINGS').maybeSingle();
      if (existAppSet && existAppSet.id) {
         const { error } = await getSupabase(req).from('promotions').update({ description: JSON.stringify(extraSettings) }).eq('id', existAppSet.id);
         if (error) console.warn("Supabase update error:", error);
      } else {
         const { error } = await getSupabase(req).from('promotions').insert({
           title: 'SYSTEM_APP_SETTINGS',
           description: JSON.stringify(extraSettings),
           visible: false
         });
         if (error) console.warn("Supabase insert error:", error);
      }
    } catch (setErr) {
      console.warn("Could not write SYSTEM_APP_SETTINGS:", setErr);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/settings/invoice error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. NICHES
router.get("/niches", async (req, res) => {
  try {
    // 1. Try reading from promotions FIRST because it contains the COMPLETE JSON (including sub-categories)
    let nichesList: any[] = [];
    try {
      const { data } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_NICHES').maybeSingle();
      if (data && data.description) {
        nichesList = JSON.parse(data.description);
      }
    } catch (e) {
      console.error("Error reading SYSTEM_NICHES from promotions:", e);
    }

    if (nichesList && nichesList.length > 0) {
      return res.json({ success: true, data: nichesList });
    }

    // 2. Fallback to standard niches table with default Swahili & English sub-categories mapping
    try {
      const { data, error } = await getSupabase(req).from('niches').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        const DEFAULT_CATEGORIES: Record<string, string[]> = {
          "electronics": ["Smartphone", "Laptops", "Accessories", "Audio", "Cameras"],
          "fashion & apparel": ["Men's Wear", "Women's Wear", "Shoes", "Watches", "Bags"],
          "home & furniture": ["Sofa", "Kitchen", "Bedding", "Decor", "Lighting"],
          "health & beauty": ["Cosmetics", "Skincare", "Haircare", "Perfumes", "Wellness"],
          "auto & motors": ["Spare Parts", "Car Accessories", "Tires", "Tools", "Fluids"],
          "groceries & food": ["Beverages", "Snacks", "Grains", "Canned Food", "Fresh Food"],
          "groceries & food/supermarket & food": ["Beverages", "Snacks", "Grains", "Canned Food", "Fresh Food"],
          "supermarket & food": ["Beverages", "Snacks", "Grains", "Canned Food", "Fresh Food"]
        };

        return res.json({
          success: true,
          data: data.map(n => {
            const key = n.name.toLowerCase().trim();
            const fallbackCats = DEFAULT_CATEGORIES[key] || [];
            return {
              name: n.name,
              icon: n.icon || 'Smartphone',
              categories: fallbackCats
            };
          })
        });
      }
    } catch (e) {}

    res.json({ success: true, data: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/niches", async (req, res) => {
  try {
    const niches = req.body;
    // Legacy support write
    try {
      const payloadLegacy = { title: 'SYSTEM_NICHES', description: JSON.stringify(niches), visible: false };
      const { data: legacyData } = await getSupabase(req).from('promotions').select('id').eq('title', 'SYSTEM_NICHES').maybeSingle();
      if (legacyData && legacyData.id) {
         await getSupabase(req).from('promotions').update(payloadLegacy).eq('id', legacyData.id);
      } else {
         await getSupabase(req).from('promotions').insert([payloadLegacy]);
      }
    } catch (e) {}

    // Standard write
    try {
      for (const niche of niches) {
        await getSupabase(req).from('niches').upsert({ name: niche.name, icon: niche.icon }, { onConflict: 'name' });
      }
      const { data: allDbNiches } = await getSupabase(req).from('niches').select('name');
      if (allDbNiches) {
        const inputNames = niches.map((n: any) => n.name);
        const toDelete = allDbNiches.filter(n => !inputNames.includes(n.name));
        for (const d of toDelete) {
          await getSupabase(req).from('niches').delete().eq('name', d.name);
        }
      }
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-POWERED NICHE SUGGESTER
router.post("/niches/suggest", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: false,
        error: "GEMINI_API_KEY_MISSING",
        message: "Gemini API key is not configured in the developer dashboard secrets yet."
      });
    }

    const { data: dbProducts, error: prodErr } = await getSupabase(req).from('products').select('*');
    if (prodErr) throw prodErr;

    const unorganizedList = (dbProducts || []).filter((p: any) => {
      const cat = p.category || '';
      if (!cat.includes('::')) return true;
      const parts = cat.split('::');
      const niche = parts[0];
      return niche === 'Electronics' || niche === 'Mengineyo' || niche === '' || niche.toLowerCase() === 'uncategorized';
    });

    if (unorganizedList.length === 0) {
      return res.json({
        success: true,
        message: "All products are properly organized!",
        suggestions: [],
        totalPending: 0
      });
    }

    const scanItems = unorganizedList.slice(0, 15).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      currentCategory: p.category || ''
    }));

    const validIcons = [
      "Smartphone", "Shirt", "Sofa", "Heart", "CarFront", "ShoppingBag", "Package", "Store", "Tag", "Ticket", 
      "Activity", "Award", "Zap", "Cpu", "Camera", "Bot", "FileText", "MessageSquare", "Laptop", "Baby", 
      "Palette", "Coffee", "Dumbbell", "Scissors", "Briefcase", "Gift", "Headphones", "Cake", "Watch", "Bike", 
      "Key", "BookOpen", "Leaf", "Flame", "Music", "Gem", "Tv", "Compass", "Footprints", "Crown", "GlassWater", 
      "Wrench", "Flower2", "Anchor", "Apple", "Banana", "Beer", "Bone", "Box", "Brain", "Brush", "Bus", 
      "Calculator", "Candy", "Cat", "ChefHat", "Clapperboard", "Cloud", "Cookie", "Dog", "Dices", "Disc", "Egg", 
      "Fan", "Feather", "Fish", "Gamepad2", "Gavel", "Guitar", "Hammer", "IceCream", "Joystick", "Lightbulb", 
      "Luggage", "Map", "Mic", "Microscope", "Moon", "Mountain", "Paintbrush", "PenTool", "Pill", "Pizza", 
      "Plane", "Plug", "Printer", "Puzzle", "Radio", "Receipt", "Rocket", "Ruler", "Scale", "Server", 
      "Shell", "ShowerHead", "Shovel", "Sprout", "Stethoscope", "Sun", "Table", "Tablet", "Tent", "Thermometer", 
      "Trophy", "Umbrella", "Utensils", "Wallet", "Wine", "Globe"
    ];

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const prompt = `You are an expert product categorizer and eCommerce catalog specialist at Orbi Shop.
Analyze the following list of unorganized or generic product listings. Recommend an appropriate main niche, category, and sub-category (family) for each product to make the store easier to browse.
Use human-friendly, standard market niches (e.g. Fashion & Apparel, Groceries, Sports & Fitness, Pet Supplies, Home & Decor, Books & Stationery, Tools, etc.) instead of default categories.

Products to organize:
${JSON.stringify(scanItems, null, 2)}

Strict constraints for your recommendation:
1. Provide a "suggestedNiche" (the top-level niche name, e.g. "Beauty & Health")
2. Provide a "suggestedCategory" (the specific subcategory in that niche, e.g. "Skin Care")
3. Provide a "suggestedFamily" (the specific sub-subcategory / brand family, e.g. "Moisturizers" or "Hisense")
4. Provide a brief explanation in 'reasoning' (1-2 sentences, bilingual Swahili/English)
5. Provide a "suggestedNicheIcon" which must be strictly selected from this exact list of valid Lucide icon names:
${validIcons.join(', ')}

Return the output as a valid JSON object matching the requested schema structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  suggestedNiche: { type: Type.STRING },
                  suggestedCategory: { type: Type.STRING },
                  suggestedFamily: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  suggestedNicheIcon: { type: Type.STRING }
                },
                required: ["productId", "productName", "suggestedNiche", "suggestedCategory", "suggestedFamily", "reasoning", "suggestedNicheIcon"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      suggestions: parsed.suggestions || [],
      totalPending: unorganizedList.length
    });
  } catch (error: any) {
    console.error("Niche Suggester server error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/niches/apply-suggestions", async (req, res) => {
  try {
    const { suggestions } = req.body;
    if (!suggestions || !Array.isArray(suggestions)) {
      return res.status(400).json({ success: false, error: "Invalid suggestions body" });
    }

    let sysNichesList: any[] = [];
    const { data: legacyNiches } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_NICHES').maybeSingle();
    if (legacyNiches && legacyNiches.description) {
      try {
        sysNichesList = JSON.parse(legacyNiches.description);
      } catch (e) {}
    }

    const { data: tblNiches } = await getSupabase(req).from('niches').select('*');
    const existingNiches = tblNiches || [];

    for (const item of suggestions) {
      const { productId, suggestedNiche, suggestedCategory, suggestedFamily, suggestedNicheIcon } = item;

      const dbCategory = `${suggestedNiche}::${suggestedCategory}::${suggestedFamily || ''}`;
      await getSupabase(req).from('products').update({ category: dbCategory }).eq('id', productId);

      const foundInLegacy = sysNichesList.find((n: any) => n.name.toLowerCase() === suggestedNiche.toLowerCase());
      if (!foundInLegacy) {
        sysNichesList.push({
          name: suggestedNiche,
          icon: suggestedNicheIcon || "Smartphone",
          categories: [{ name: suggestedCategory, families: suggestedFamily ? [suggestedFamily] : [] }]
        });
      } else {
        const cats = Array.isArray(foundInLegacy.categories) ? foundInLegacy.categories : [];
        const existingCat = cats.find((c: any) => (typeof c === 'string' ? c : c.name).toLowerCase() === suggestedCategory.toLowerCase());
        
        if (!existingCat) {
          cats.push({ name: suggestedCategory, families: suggestedFamily ? [suggestedFamily] : [] });
          foundInLegacy.categories = cats;
        } else if (suggestedFamily) {
          if (typeof existingCat === 'string') {
            // Migration: Convert string category to object if needed
            const idx = cats.indexOf(existingCat);
            cats[idx] = { name: existingCat, families: [suggestedFamily] };
          } else {
            const fams = existingCat.families || [];
            if (!fams.includes(suggestedFamily)) {
              fams.push(suggestedFamily);
              existingCat.families = fams;
            }
          }
        }
      }

      const foundInDb = existingNiches.find((n: any) => n.name.toLowerCase() === suggestedNiche.toLowerCase());
      if (!foundInDb) {
        await getSupabase(req).from('niches').upsert({
          name: suggestedNiche,
          icon: suggestedNicheIcon || "Smartphone"
        }, { onConflict: 'name' });
      }
    }

    const payloadLegacy = { title: 'SYSTEM_NICHES', description: JSON.stringify(sysNichesList), visible: false };
    if (legacyNiches) {
      await getSupabase(req).from('promotions').update(payloadLegacy).eq('title', 'SYSTEM_NICHES');
    } else {
      await getSupabase(req).from('promotions').insert([payloadLegacy]);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Niche Suggester apply error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. STAFF
router.get("/staff", async (req, res) => {
  try {
    let selectRes = await getSupabase(req).from('staff_roles').select('*').order('created_at', { ascending: true });
    const data = selectRes.data;
    const error = selectRes.error;

    if (error) {
      // Legacy promotions fallback check
      let legacyRes = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_STAFF').maybeSingle();
      if (legacyRes.error) {
        legacyRes = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_STAFF').maybeSingle();
      }
      const legacy = legacyRes.data;
      let fallbackList = [];
      if (legacy && legacy.description) {
        try { fallbackList = JSON.parse(legacy.description); } catch(pe) {}
      }
      return res.json({ success: true, data: fallbackList });
    }
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/staff", async (req, res) => {
  try {
    const staffList = req.body;
    try {
      const { data: existingData } = await getSupabase(req).from('staff_roles').select('email');
      const existingEmails = existingData?.map(d => d.email) || [];
      const incomingEmails = staffList.map((s: any) => s.email.toLowerCase());
      
      const toDeleteEmails = existingEmails.filter(email => !incomingEmails.includes(email.toLowerCase()) && email !== 'admin.orbi@gmail.com');
      if (toDeleteEmails.length > 0) {
        await getSupabase(req).from('staff_roles').delete().in('email', toDeleteEmails);
      }

      for (const s of staffList) {
        if (s.email.toLowerCase() === 'admin.orbi@gmail.com') continue;
        const payload = {
          name: s.name,
          email: s.email.toLowerCase(),
          role: s.role,
          status: s.status || 'active',
          permissions: ['*']
        };
        const { data: existing } = await getSupabase(req).from('staff_roles').select('id').eq('email', s.email.toLowerCase()).maybeSingle();
        if (existing) {
          await getSupabase(req).from('staff_roles').update(payload).eq('id', existing.id);
        } else {
          await getSupabase(req).from('staff_roles').insert([payload]);
        }
      }
    } catch (e) {}

    // Legacy backup write
    try {
      const payloadLegacy = { title: 'SYSTEM_STAFF', description: JSON.stringify(staffList), visible: false };
      const { data: legacyData } = await getSupabase(req).from('promotions').select('id').eq('title', 'SYSTEM_STAFF').maybeSingle();
      if (legacyData && legacyData.id) {
         await getSupabase(req).from('promotions').update(payloadLegacy).eq('id', legacyData.id);
      } else {
         await getSupabase(req).from('promotions').insert([payloadLegacy]);
      }
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. SELLERS
router.get("/sellers", async (req, res) => {
  try {
    try {
      const { data, error } = await getSupabase(req).from('sellers').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          avatar: s.avatar || undefined,
          banner: s.banner || undefined,
          isPro: s.is_pro || false,
          proUntil: s.pro_until ? new Date(s.pro_until).getTime() : undefined,
          email: s.email || undefined,
          activePlanId: s.active_plan_id || undefined,
          subscriptionPaidAt: s.subscription_paid_at ? new Date(s.subscription_paid_at).getTime() : undefined,
          status: s.status || "active",
          deleteRequested: s.delete_requested || false,
          invoiceCompanyName: s.invoice_company_name || undefined,
          invoiceAddress: s.invoice_address || undefined,
          invoicePhone: s.invoice_phone || undefined,
          invoiceEmail: s.invoice_email || undefined,
          invoiceTerms: s.invoice_terms || undefined
        }));
        return res.json({ success: true, data: mapped });
      }
    } catch (e) {}

    const { data } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_SELLERS').maybeSingle();
    let sellersList = [{ id: 'S1', name: 'Orbi Official', description: 'Official products directly provided by Orbi Shop.', avatar: 'https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png' }];
    if (data && data.description) {
      try { sellersList = JSON.parse(data.description); } catch(pe) {}
    }
    res.json({ success: true, data: sellersList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/sellers", async (req, res) => {
  try {
    const sellers = req.body;

    // Load any existing sellers BEFORE overwriting to detect additions & approvals
    let existingIds: string[] = [];
    let existingSellers: any[] = [];
    try {
      const { data: legacyData } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_SELLERS').maybeSingle();
      if (legacyData && legacyData.description) {
        try {
          const parsed = JSON.parse(legacyData.description);
          if (Array.isArray(parsed)) {
            existingSellers = parsed;
            existingIds = parsed.map((s: any) => s.id);
          }
        } catch (pe) {}
      }
    } catch (e) {
      console.error("[SELLER REGISTRATION] Error fetching existing state:", e);
    }

    // System backup write
    try {
      const payloadLegacy = { title: 'SYSTEM_SELLERS', description: JSON.stringify(sellers), visible: false };
      const { data: legacyData } = await getSupabase(req).from('promotions').select('id').eq('title', 'SYSTEM_SELLERS').maybeSingle();
      if (legacyData && legacyData.id) {
         await getSupabase(req).from('promotions').update(payloadLegacy).eq('id', legacyData.id);
      } else {
         await getSupabase(req).from('promotions').insert([payloadLegacy]);
      }
    } catch (e) {}

    // Detect newly created or newly active/approved sellers to provision and send credentials
    try {
      const { sendOrbiTalkDirectSMS, sendOrbiTalkDirectEmail } = await import("./talk.js");

      for (const seller of sellers) {
        const isNew = seller && seller.id && !existingIds.includes(seller.id);
        const existingSeller = seller && seller.id ? existingSellers.find((e: any) => e.id === seller.id) : null;
        const wasApprovedNow = seller && existingSeller && (seller.isApproved === true || seller.status === "active") && (existingSeller.isApproved === false || existingSeller.status !== "active");

        if (isNew || wasApprovedNow) {
          console.log(`[SELLER REGISTRATION RUN] Seller detected for credentials provisioning! ID: ${seller.id}, Name: ${seller.name}`);
          
          const password = seller.password || "123456";
          const email = seller.email || "";
          const phone = seller.invoicePhone || seller.phone || "";
          const name = seller.name || "Vendor";

          // 1. Provision user in Supabase Auth to allow logins immediately
          if (email && password) {
            console.log(`[SELLER REGISTRATION] Auto-registering/provisioning seller: ${email} with password`);
            await getSupabase(req).auth.signUp({
              email: email.trim(),
              password: password.trim(),
              options: {
                data: {
                  full_name: name,
                  role: "seller"
                }
              }
            }).then(({ data: signUpData, error: signUpError }) => {
              if (signUpError) {
                console.log(`[SELLER REGISTRATION] Supabase Auth sign-up error or already exists:`, signUpError.message);
              } else {
                console.log(`[SELLER REGISTRATION] Supabase Auth account provisioned successfully for:`, email);
              }
            }).catch(ae => {
              console.log(`[SELLER REGISTRATION] Supabase Auth sign-up promise error:`, ae.message);
            });
          }

          // 2. Draft and send Orbi Talk notifications with credentials
          const subject = "Karibu Orbi Shop - Akaunti ya Muuzaji / Welcome to Orbi Shop Merchant Portal";
          
          const messageBodySw = `Sajili ya muuzaji imefanikiwa!\n\nJina la Duka: ${name}\nIngia kupitia Tovuti ya Wauzaji kwa:\nBarua pepe: ${email}\nNenosiri: ${password}\n\nTafadhali badili nenosiri lako mara utakapoingia kwa mara ya kwanza.\n\nAsante kwa kuamua kufanya biashara na Orbi Shop!`;
          const messageBodyEn = `Merchant registration successful!\n\nStore Name: ${name}\nLog in to the Merchant Portal using:\nEmail/Username: ${email}\nPassword: ${password}\n\nPlease update your temporary password on your first sign-in.\n\nThank you for partnering with Orbi Shop!`;

          const combinedBody = `${messageBodySw}\n\n---\n\n${messageBodyEn}`;

          // Send SMS if a phone number exists
          if (phone) {
            const cleanPhone = phone.trim().replace(/\s+/g, "");
            console.log(`[SELLER REGISTRATION RUN] Dispatching Welcome SMS to ${cleanPhone}`);
            await sendOrbiTalkDirectSMS({
              recipient: cleanPhone,
              body: combinedBody,
              requestId: `SLR_SMS_${seller.id}_${Date.now()}`
            }).catch(err => console.error("Error sending direct SMS to seller:", err));
          }

          // Send Email if email exists
          if (email) {
            console.log(`[SELLER REGISTRATION RUN] Dispatching Welcome Email to ${email}`);
            await sendOrbiTalkDirectEmail({
              recipient: email.trim(),
              subject: subject,
              body: combinedBody,
              requestId: `SLR_EML_${seller.id}_${Date.now()}`,
              ownerEmail: "sellers@orbifinancial.com",
              senderName: "Orbi Shop"
            }).catch(err => console.error("Error sending direct Email to seller:", err));
          }
        }
      }
    } catch (triggerError) {
      console.error("[SELLER REGISTRATION TRIGGER ERROR]", triggerError);
    }

    // Sellers table write
    try {
      for (const seller of sellers) {
        const isUuid = seller.id.length > 20 && seller.id.includes('-');
        const row: any = {
          name: seller.name,
          description: seller.description,
          avatar: seller.avatar || null,
          banner: seller.banner || null,
          is_pro: seller.isPro || false,
          pro_until: seller.proUntil ? new Date(seller.proUntil).toISOString() : null,
          email: seller.email || null,
          active_plan_id: seller.activePlanId || null,
          subscription_paid_at: seller.subscriptionPaidAt ? new Date(seller.subscriptionPaidAt).toISOString() : null,
          status: seller.status || 'active',
          delete_requested: seller.deleteRequested || false,
          invoice_company_name: seller.invoiceCompanyName || null,
          invoice_address: seller.invoiceAddress || null,
          invoice_phone: seller.invoicePhone || null,
          invoice_email: seller.invoiceEmail || null,
          invoice_terms: seller.invoiceTerms || null,
          legacy_id: !isUuid ? seller.id : undefined
        };
        
        if (isUuid) {
          row.id = seller.id;
        } else {
          const { data: found } = await getSupabase(req).from('sellers').select('id').eq('legacy_id', seller.id).maybeSingle();
          if (found && found.id) {
            row.id = found.id;
          }
        }
        await getSupabase(req).from('sellers').upsert(row);
      }

      // Handle deletions
      const { data: allDbSellers } = await getSupabase(req).from('sellers').select('id, legacy_id');
      if (allDbSellers) {
        const inputIds = sellers.map((s: any) => s.id);
        const toDelete = allDbSellers.filter(dbS => {
          if (dbS.id && inputIds.includes(dbS.id)) return false;
          if (dbS.legacy_id && inputIds.includes(dbS.legacy_id)) return false;
          return true;
        });
        for (const d of toDelete) {
          await getSupabase(req).from('sellers').delete().eq('id', d.id);
        }
      }
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/sellers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.invoice_company_name !== undefined) payload.invoice_company_name = updates.invoice_company_name;
    if (updates.invoice_address !== undefined) payload.invoice_address = updates.invoice_address;
    if (updates.invoice_phone !== undefined) payload.invoice_phone = updates.invoice_phone;
    if (updates.invoice_email !== undefined) payload.invoice_email = updates.invoice_email;
    if (updates.invoice_terms !== undefined) payload.invoice_terms = updates.invoice_terms;
    if (updates.tin !== undefined) payload.tin = updates.tin;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    if (updates.businessLogo !== undefined) payload.business_logo = updates.businessLogo;
    if (updates.business_logo !== undefined) payload.business_logo = updates.business_logo;

    const { error } = await getSupabase(req).from('sellers').update(payload).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. PAYOUTS
router.get("/payouts", async (req, res) => {
  try {
    let selectRes = await getSupabase(req).from('payouts').select('*').order('requested_at', { ascending: false });
    if (selectRes.error) throw selectRes.error;
    const data = selectRes.data;

    const mapped = (data || []).map(p => ({
      id: p.id,
      sellerId: p.seller_id,
      amount: p.amount,
      status: p.status,
      requestedAt: new Date(p.requested_at).getTime(),
      paidAt: p.paid_at ? new Date(p.paid_at).getTime() : undefined
    }));
    res.json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/payouts", async (req, res) => {
  try {
    const payout = req.body;
    const payload = {
      seller_id: payout.sellerId,
      amount: payout.amount,
      status: payout.status,
      paid_at: payout.paidAt ? new Date(payout.paidAt).toISOString() : null
    };
    if (payout.id && payout.id.length > 20) {
      await getSupabase(req).from('payouts').update(payload).eq('id', payout.id);
    } else {
      await getSupabase(req).from('payouts').insert([payload]);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. AI PILOT
router.get("/ai-pilot", async (req, res) => {
  try {
    const defaultSettings = { autoApprove: true, autoCategorize: true, autoMessage: true, smartPromotion: true, securityMonitor: true };
    const { data } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_AI_PILOT_SETTINGS').maybeSingle();
    let settings = defaultSettings;
    if (data && data.description) {
      try {
        settings = { ...defaultSettings, ...JSON.parse(data.description) };
      } catch (e) {}
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/ai-pilot", async (req, res) => {
  try {
    const settings = req.body;
    const payload = {
      title: 'SYSTEM_AI_PILOT_SETTINGS',
      description: JSON.stringify(settings),
      visible: false
    };
    const { data } = await getSupabase(req).from('promotions').select('id').eq('title', 'SYSTEM_AI_PILOT_SETTINGS').maybeSingle();
    let error;
    if (data && data.id) {
       error = (await getSupabase(req).from('promotions').update(payload).eq('id', data.id)).error;
    } else {
       error = (await getSupabase(req).from('promotions').insert([payload])).error;
    }

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. SUBSCRIPTION PLANS
router.get("/subscription-plans", async (req, res) => {
  try {
    const { data } = await getSupabase(req).from('promotions').select('description').eq('title', 'SYSTEM_SUBSCRIPTION_PLANS').maybeSingle();
    let plans = [
      { id: 'sub-bronze', name: 'Bronze', nameSw: 'Shaba (Bronze)', price: 15000, days: 30, description: 'Basic listings, Standard support', descriptionSw: 'Orodha za msingi, Msaada wa kawaida', active: true },
      { id: 'sub-silver', name: 'Silver', nameSw: 'Fedha (Silver)', price: 45000, days: 90, description: 'Higher search ordering, Standard branding', descriptionSw: 'Nafasi ya juu ya utafutaji, Nembo ya biashara', active: true },
      { id: 'sub-gold', name: 'Gold', nameSw: 'Dhahabu (Gold)', price: 120000, days: 365, description: 'Top placement, VIP seller badge, Premium support', descriptionSw: 'Nafasi ya juu kabisa, Beji ya muuzaji wa VIP, Msaada wa haraka', active: true },
    ];
    if (data && data.description) {
      try {
        plans = JSON.parse(data.description);
      } catch (e) {}
    }
    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/subscription-plans", async (req, res) => {
  try {
    const plans = req.body;
    const payload = {
      title: 'SYSTEM_SUBSCRIPTION_PLANS',
      description: JSON.stringify(plans),
      visible: false
    };
    const { data } = await getSupabase(req).from('promotions').select('id').eq('title', 'SYSTEM_SUBSCRIPTION_PLANS').maybeSingle();
    let error;
    if (data && data.id) {
       error = (await getSupabase(req).from('promotions').update(payload).eq('id', data.id)).error;
    } else {
       error = (await getSupabase(req).from('promotions').insert([payload])).error;
    }

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

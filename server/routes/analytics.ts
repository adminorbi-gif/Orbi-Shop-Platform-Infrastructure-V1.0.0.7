import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import path from "path";
import fs from "fs";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

// AUTHORITATIVE SERVER-SIDE AD METRICS TRACKING
router.post("/ads/track", async (req, res) => {
  try {
    const { adId, action } = req.body; // action: 'impression' | 'click'
    if (!adId || !action) {
      return res.status(400).json({ success: false, message: "Missing adId or action parameters." });
    }

    // Fetch from Supabase promotions table with 'SYSTEM_MARKETPLACE_ADS'
    const { data, error } = await supabase
      .from('promotions')
      .select('id, description')
      .eq('title', 'SYSTEM_MARKETPLACE_ADS')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: "Advertisements catalog table not found." });
    }

    let adsList: any[] = [];
    try {
      adsList = JSON.parse(data.description || "[]");
    } catch (e) {
      adsList = [];
    }

    let updatedAd: any = null;
    let adsChanged = false;

    adsList = adsList.map((ad: any) => {
      if (ad.id === adId) {
        adsChanged = true;
        // Secure initialize sub-objects
        if (!ad.metrics) {
          ad.metrics = { impressions: 0, clicks: 0, ctr: 0 };
        }
        ad.totalSpent = Number(ad.totalSpent) || 0;
        ad.budgetLimit = Number(ad.budgetLimit) || 100000;
        ad.bidAmount = Number(ad.bidAmount) || 200;

        if (action === "impression") {
          ad.metrics.impressions = (ad.metrics.impressions || 0) + 1;
        } else if (action === "click") {
          ad.metrics.clicks = (ad.metrics.clicks || 0) + 1;
          // Charge the CPC bid amount to the total ad budget
          ad.totalSpent += ad.bidAmount;
          
          // Autocompleted/Budget met state machine control
          if (ad.totalSpent >= ad.budgetLimit) {
            ad.status = "completed";
            ad.visible = false;
          }
        }

        // Recalculate Click-Through-Rate strictly on server
        const imps = Math.max(1, ad.metrics.impressions);
        ad.metrics.ctr = Number(((ad.metrics.clicks / imps) * 100).toFixed(2));
        updatedAd = ad;
      }
      return ad;
    });

    if (adsChanged) {
      // Save the updated list back to the server
      const payload = {
        title: "SYSTEM_MARKETPLACE_ADS",
        description: JSON.stringify(adsList),
        visible: false
      };
      await supabase
        .from('promotions')
        .update(payload)
        .eq('id', data.id);
    }

    return res.json({
      success: true,
      action,
      adId,
      metrics: updatedAd ? updatedAd.metrics : null,
      totalSpent: updatedAd ? updatedAd.totalSpent : 0,
      status: updatedAd ? updatedAd.status : null
    });
  } catch (err: any) {
    console.error("[SERVER AD METRICS FAILURE]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Redis-style fake DB logic
const REDIS_FILE_PATH = path.join(process.cwd(), "competitor_redis.json");
const VISITOR_SESSIONS_FILE_PATH = path.join(process.cwd(), "visitor_sessions.json");

const tanzaniaRegions = [
  { city: "Dar es Salaam", region: "Pwani / Dar", lat: -6.7924, lng: 39.2083 },
  { city: "Arusha", region: "Northern Highlands", lat: -3.3731, lng: 36.6853 },
  { city: "Mwanza", region: "Lake Zone", lat: -2.5164, lng: 32.8987 },
  { city: "Dodoma", region: "Central Tanzania", lat: -6.1731, lng: 35.7419 },
  { city: "Zanzibar", region: "Zanzibar Archipelago", lat: -6.1659, lng: 39.2026 },
  { city: "Mbeya", region: "Southern Highlands", lat: -8.9080, lng: 33.4518 },
  { city: "Morogoro", region: "Eastern Region", lat: -6.8278, lng: 37.6591 }
];

const devices = ["Mobile", "Desktop", "Tablet"];
const carriers = ["Vodacom", "Airtel", "Halotel", "Tigo", "TTCL", "WiFi"];

function generateHistoricalSessions() {
  const historical: any[] = [];
  const now = new Date();
  
  for (let i = 0; i < 18; i++) {
    const timeOffset = Math.floor(Math.random() * 24 * 3600 * 1000);
    const timestamp = new Date(now.getTime() - timeOffset);
    const isConv = Math.random() > 0.65;
    const region = tanzaniaRegions[Math.floor(Math.random() * tanzaniaRegions.length)];
    historical.push({
      id: `v-hr-${i}`,
      ip: `197.22.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      device: devices[Math.floor(Math.random() * devices.length)],
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      location: region,
      searches: [{ query: "solar battery", timestamp: timestamp.toISOString(), source: "dictionary" }],
      cartActions: isConv ? [{ action: "add", productName: "Solar Inverter", timestamp: timestamp.toISOString() }] : [],
      checkoutCompleted: isConv,
      orderTotal: isConv ? Math.floor(35 + Math.random() * 90) * 1000 : undefined,
      createdAt: timestamp.toISOString(),
      lastActive: timestamp.toISOString()
    });
  }

  for (let i = 0; i < 26; i++) {
    const timeOffset = Math.floor(Math.random() * 7 * 24 * 3600 * 1000);
    const timestamp = new Date(now.getTime() - timeOffset);
    const isConv = Math.random() > 0.7;
    const region = tanzaniaRegions[Math.floor(Math.random() * tanzaniaRegions.length)];
    historical.push({
      id: `v-dy-${i}`,
      ip: `102.16.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      device: devices[Math.floor(Math.random() * devices.length)],
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      location: region,
      searches: [{ query: "feni ya upepo", timestamp: timestamp.toISOString(), source: "ai" }],
      cartActions: isConv ? [{ action: "add", productName: "Oscillating Fan 16\"", timestamp: timestamp.toISOString() }] : [],
      checkoutCompleted: isConv,
      orderTotal: isConv ? Math.floor(45 + Math.random() * 45) * 1000 : undefined,
      createdAt: timestamp.toISOString(),
      lastActive: timestamp.toISOString()
    });
  }

  for (let i = 0; i < 30; i++) {
    const timeOffset = Math.floor(Math.random() * 30 * 24 * 3600 * 1000);
    const timestamp = new Date(now.getTime() - timeOffset);
    const isConv = Math.random() > 0.6;
    const region = tanzaniaRegions[Math.floor(Math.random() * tanzaniaRegions.length)];
    historical.push({
      id: `v-wk-${i}`,
      ip: `41.88.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      device: devices[Math.floor(Math.random() * devices.length)],
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      location: region,
      searches: [{ query: "chombo cha maji", timestamp: timestamp.toISOString(), source: "cache" }],
      cartActions: isConv ? [{ action: "add", productName: "Eco Filter Pitcher", timestamp: timestamp.toISOString() }] : [],
      checkoutCompleted: isConv,
      orderTotal: isConv ? Math.floor(18 + Math.random() * 40) * 1000 : undefined,
      createdAt: timestamp.toISOString(),
      lastActive: timestamp.toISOString()
    });
  }

  for (let i = 0; i < 45; i++) {
    const timeOffset = Math.floor(Math.random() * 365 * 24 * 3600 * 1000);
    const timestamp = new Date(now.getTime() - timeOffset);
    const isConv = Math.random() > 0.55;
    const region = tanzaniaRegions[Math.floor(Math.random() * tanzaniaRegions.length)];
    historical.push({
      id: `v-mo-${i}`,
      ip: `197.80.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      device: devices[Math.floor(Math.random() * devices.length)],
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      location: region,
      searches: [],
      cartActions: [],
      checkoutCompleted: isConv,
      orderTotal: isConv ? Math.floor(60 + Math.random() * 200) * 1000 : undefined,
      createdAt: timestamp.toISOString(),
      lastActive: timestamp.toISOString()
    });
  }

  for (let i = 0; i < 60; i++) {
    const timeOffset = Math.floor(Math.random() * 5 * 365 * 24 * 3600 * 1000);
    const timestamp = new Date(now.getTime() - timeOffset);
    const isConv = Math.random() > 0.5;
    const region = tanzaniaRegions[Math.floor(Math.random() * tanzaniaRegions.length)];
    historical.push({
      id: `v-yr-${i}`,
      ip: `41.250.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      device: devices[Math.floor(Math.random() * devices.length)],
      carrier: carriers[Math.floor(Math.random() * carriers.length)],
      location: region,
      searches: [],
      cartActions: [],
      checkoutCompleted: isConv,
      orderTotal: isConv ? Math.floor(80 + Math.random() * 400) * 1000 : undefined,
      createdAt: timestamp.toISOString(),
      lastActive: timestamp.toISOString()
    });
  }

  return historical;
}

router.get("/visitor-sessions", (req, res) => {
  try {
    let sessions = [];
    if (fs.existsSync(VISITOR_SESSIONS_FILE_PATH)) {
      sessions = JSON.parse(fs.readFileSync(VISITOR_SESSIONS_FILE_PATH, "utf-8"));
    } else {
      sessions = generateHistoricalSessions();
      fs.writeFileSync(VISITOR_SESSIONS_FILE_PATH, JSON.stringify(sessions, null, 2), "utf-8");
    }
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/competitor-insights", (req, res) => {
  try {
    let data = {};
    if (fs.existsSync(REDIS_FILE_PATH)) {
      data = JSON.parse(fs.readFileSync(REDIS_FILE_PATH, "utf-8"));
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

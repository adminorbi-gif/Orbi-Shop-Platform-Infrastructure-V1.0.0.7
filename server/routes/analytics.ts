import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { decryptObject } from "../lib/supabase.js";
import ws from "ws";
import path from "path";
import fs from "fs";
import { sendOrbiTalkDirectEmail, sendOrbiTalkDirectSMS } from "./talk.js";

const router = Router();

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

// GET /visitors - Return aggregated session statistics and session logs
router.get("/visitors", (req, res) => {
  try {
    let sessions = [];
    if (fs.existsSync(VISITOR_SESSIONS_FILE_PATH)) {
      try {
        sessions = JSON.parse(fs.readFileSync(VISITOR_SESSIONS_FILE_PATH, "utf-8"));
      } catch (e) {
        sessions = [];
      }
    }
    if (sessions.length === 0) {
      sessions = generateHistoricalSessions();
      fs.writeFileSync(VISITOR_SESSIONS_FILE_PATH, JSON.stringify(sessions, null, 2), "utf-8");
    }

    // Calculate aggregate statistics
    const totalSessions = sessions.length;
    const checkoutCount = sessions.filter((s: any) => s.checkoutCompleted).length;
    const conversionRate = totalSessions > 0 ? (checkoutCount / totalSessions) * 100 : 0;
    const totalSales = sessions.reduce((sum: number, s: any) => {
      if (s.checkoutCompleted && s.orderTotal) {
        return sum + Number(s.orderTotal);
      }
      return sum;
    }, 0);

    // Group searches
    const searchCounts: { [key: string]: number } = {};
    sessions.forEach((s: any) => {
      if (s.searches && Array.isArray(s.searches)) {
        s.searches.forEach((srch: any) => {
          const q = (srch.query || "").trim();
          if (q) {
            searchCounts[q] = (searchCounts[q] || 0) + 1;
          }
        });
      }
    });
    const topSearches = Object.entries(searchCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Group location stats
    const locationCounts: { [key: string]: { count: number; lat: number; lng: number } } = {};
    sessions.forEach((s: any) => {
      const city = s.location?.city;
      if (city) {
        if (!locationCounts[city]) {
          locationCounts[city] = {
            count: 0,
            lat: s.location.lat || -6.7924,
            lng: s.location.lng || 39.2083
          };
        }
        locationCounts[city].count += 1;
      }
    });
    const locationStats = Object.entries(locationCounts)
      .map(([city, data]) => ({
        city,
        count: data.count,
        lat: data.lat,
        lng: data.lng
      }))
      .sort((a, b) => b.count - a.count);

    const stats = {
      totalSessions,
      conversionRate,
      checkoutCount,
      totalSales,
      cacheSize: totalSessions,
      circuitState: { active: false, cooldownRemainingMs: 0 },
      topSearches,
      locationStats
    };

    let competitorAnalysis: any = {};
    if (fs.existsSync(REDIS_FILE_PATH)) {
      try {
        competitorAnalysis = JSON.parse(fs.readFileSync(REDIS_FILE_PATH, "utf-8"));
      } catch (e) {
        competitorAnalysis = {};
      }
    }

    res.json({
      success: true,
      stats,
      sessions,
      competitorAnalysis
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /visitors/event - Log a live client tracking event
router.post("/visitors/event", (req, res) => {
  try {
    const { sessionId, action, productId, productName, orderTotal, purchasedProducts } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: "Missing sessionId" });
    }

    let sessions = [];
    if (fs.existsSync(VISITOR_SESSIONS_FILE_PATH)) {
      try {
        sessions = JSON.parse(fs.readFileSync(VISITOR_SESSIONS_FILE_PATH, "utf-8"));
      } catch (e) {
        sessions = [];
      }
    }
    if (sessions.length === 0) {
      sessions = generateHistoricalSessions();
    }

    let sess = sessions.find((s: any) => s.id === sessionId);
    const nowStr = new Date().toISOString();

    if (!sess) {
      // Create a new session
      const region = tanzaniaRegions[Math.floor(Math.random() * tanzaniaRegions.length)];
      sess = {
        id: sessionId,
        ip: `197.26.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
        device: "Mobile",
        carrier: "Vodacom",
        location: region,
        searches: [],
        cartActions: [],
        checkoutCompleted: false,
        createdAt: nowStr,
        lastActive: nowStr
      };
      sessions.unshift(sess);
    } else {
      sess.lastActive = nowStr;
    }

    if (action === "product_view") {
      if (productName) {
        // Prevent duplicate consecutive direct views to keep data neat
        const lastSearch = sess.searches[sess.searches.length - 1];
        if (!lastSearch || lastSearch.query !== productName) {
          sess.searches.push({
            query: productName,
            timestamp: nowStr,
            source: "direct"
          });
        }
      }
    } else if (action === "cart_add") {
      if (productName) {
        sess.cartActions.push({
          action: "add",
          productName: productName,
          timestamp: nowStr
        });
      }
    } else if (action === "checkout_complete") {
      sess.checkoutCompleted = true;
      if (orderTotal) {
        sess.orderTotal = Number(orderTotal);
      }
      if (purchasedProducts && Array.isArray(purchasedProducts)) {
        purchasedProducts.forEach((p: any) => {
          sess.cartActions.push({
            action: "purchase",
            productName: p.name,
            timestamp: nowStr
          });
        });
      }
    }

    fs.writeFileSync(VISITOR_SESSIONS_FILE_PATH, JSON.stringify(sessions, null, 2), "utf-8");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

// GET /api/analytics/rising-stars - Calculate rising stars based on sales velocity increase
router.get("/rising-stars", async (req, res) => {
  try {
    // 1. Fetch recent orders (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .gte('created_at', fourteenDaysAgo.toISOString());

    if (error) throw error;
    
    const decryptedOrders = decryptObject(orders || []);
    
    // 2. Group orders by product and period
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const velocity: Record<string, { lastWeek: number, prevWeek: number, name: string }> = {};
    
    decryptedOrders.forEach((order: any) => {
      const orderDate = new Date(order.created_at);
      const isLastWeek = orderDate >= sevenDaysAgo;
      
      order.items.forEach((item: any) => {
        if (!velocity[item.product_id]) {
          velocity[item.product_id] = { lastWeek: 0, prevWeek: 0, name: item.name };
        }
        if (isLastWeek) {
          velocity[item.product_id].lastWeek += item.quantity;
        } else {
          velocity[item.product_id].prevWeek += item.quantity;
        }
      });
    });

    // 3. Identify Rising Stars (highest velocity increase)
    const risingStars = Object.entries(velocity)
      .map(([productId, counts]) => {
        const increase = counts.prevWeek === 0 ? counts.lastWeek * 100 : (counts.lastWeek - counts.prevWeek) / counts.prevWeek * 100;
        return { productId, ...counts, increase: Number(increase.toFixed(2)) };
      })
      .filter(p => p.increase > 0)
      .sort((a, b) => b.increase - a.increase)
      .slice(0, 5);

    // 4. Send notification if not already sent this week
    const { data: reportData } = await supabase
      .from('promotions')
      .select('*')
      .eq('title', 'SYSTEM_RISING_STARS_REPORT')
      .maybeSingle();

    let shouldNotify = false;
    if (!reportData || !reportData.description) {
      shouldNotify = true;
    } else {
      const lastSent = new Date(JSON.parse(reportData.description).lastSent);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (now.getTime() - lastSent.getTime() > oneWeek) {
        shouldNotify = true;
      }
    }

    if (shouldNotify && risingStars.length > 0) {
      // Get all sellers to notify
      const { data: sellers } = await supabase.from('customers').select('name, email, phone').eq('role', 'seller');
      
      const reportText = risingStars.map((p, i) => `${i + 1}. ${p.name} (+${p.increase}%)`).join('\n');
      
      if (sellers) {
        for (const seller of sellers) {
          if (seller.email) {
            await sendOrbiTalkDirectEmail({
              recipient: seller.email,
              subject: "Weekly Rising Stars Report",
              body: `Hello ${seller.name},\n\nHere are your rising star products for the week:\n\n${reportText}\n\nKeep up the great work!`,
              requestId: `rising-stars-${seller.email}-${now.getTime()}`
            });
          }
        }
      }

      // Update record
      const payload = {
        title: 'SYSTEM_RISING_STARS_REPORT',
        description: JSON.stringify({ lastSent: now.toISOString() }),
        visible: false
      };
      
      if (reportData && reportData.id) {
        await supabase.from('promotions').update(payload).eq('id', reportData.id);
      } else {
        await supabase.from('promotions').insert([payload]);
      }
    }

    res.json({ success: true, data: risingStars });
  } catch (err: any) {
    console.error("GET /api/analytics/rising-stars failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

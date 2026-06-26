import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

/**
 * POST /api/subscriptions/subscribe
 * Processes a package upgrade request for a seller.
 * Computes expiration dates correctly based on subscription duration days.
 */
router.post("/subscribe", async (req: any, res: any) => {
  try {
    const { sellerId, planId, paymentDetails } = req.body;
    
    if (!sellerId || !planId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields (sellerId, planId)" 
      });
    }

    // 1. Fetch valid subscription plans
    const { data: promoData } = await supabase
      .from("promotions")
      .select("description")
      .eq("title", "SYSTEM_SUBSCRIPTION_PLANS")
      .maybeSingle();

    let plans = [
      { id: "sub-bronze", name: "Bronze", nameSw: "Shaba (Bronze)", price: 15000, days: 30, description: "Basic listings, Standard support", descriptionSw: "Orodha za msingi, Msaada wa kawaida", active: true },
      { id: "sub-silver", name: "Silver", nameSw: "Fedha (Silver)", price: 45000, days: 90, description: "Higher search ordering, Standard branding", descriptionSw: "Nafasi ya juu ya utafutaji, Nembo ya biashara", active: true },
      { id: "sub-gold", name: "Gold", nameSw: "Dhahabu (Gold)", price: 120000, days: 365, description: "Top placement, VIP seller badge, Premium support", descriptionSw: "Nafasi ya juu kabisa, Beji ya muuzaji wa VIP, Msaada wa haraka", active: true },
    ];

    if (promoData && promoData.description) {
      try {
        plans = JSON.parse(promoData.description);
      } catch (e) {
        console.warn("Could not parse SYSTEM_SUBSCRIPTION_PLANS description.", e);
      }
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: "Specifed subscription plan not found" 
      });
    }

    // 2. Fetch all sellers
    const { data: sellersPromo } = await supabase
      .from("promotions")
      .select("id, description")
      .eq("title", "SYSTEM_SELLERS")
      .maybeSingle();

    if (!sellersPromo) {
      return res.status(404).json({ 
        success: false, 
        message: "SYSTEM_SELLERS storage promotion not initialized yet" 
      });
    }

    let sellers: any[] = [];
    try {
      sellers = JSON.parse(sellersPromo.description || "[]");
    } catch (e) {
      console.warn("Could not parse SYSTEM_SELLERS description.", e);
    }

    const sellerIdx = sellers.findIndex((s) => s.id === sellerId);
    if (sellerIdx === -1) {
      return res.status(404).json({ 
        success: false, 
        message: `Seller profile ID '${sellerId}' not found` 
      });
    }

    const seller = sellers[sellerIdx];

    // 3. Calculate expiration: if already active PRO, extend it. Otherwise start from today.
    const addedTime = plan.days * 24 * 60 * 60 * 1000;
    const currentProUntil = seller.proUntil || 0;
    const newProUntil = currentProUntil > Date.now() ? currentProUntil + addedTime : Date.now() + addedTime;

    sellers[sellerIdx] = {
      ...seller,
      isPro: true,
      proUntil: newProUntil,
      activePlanId: plan.id,
      subscriptionPaidAt: Date.now()
    };

    // 4. Save back to Supabase securely
    const { error: updateError } = await supabase
      .from("promotions")
      .update({ description: JSON.stringify(sellers) })
      .eq("id", sellersPromo.id);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: `Successfully subscripted to ${plan.name} Plan!`,
      proUntil: newProUntil,
      transactionId: `TX-ORBI-SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      planName: plan.name,
      status: "active"
    });

  } catch (error: any) {
    console.error("Subscription upgrade API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to process subscription" 
    });
  }
});

export default router;

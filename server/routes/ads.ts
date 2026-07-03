import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();
const SYSTEM_ADS_TITLE = "SYSTEM_MARKETPLACE_ADS";

function isBillableAd(ad: any) {
  if (!ad || ad.visible === false) return false;
  if (ad.status === "paused" || ad.status === "pending" || ad.status === "completed") return false;
  const budgetLimit = Number(ad.budgetLimit || 0);
  const totalSpent = Number(ad.totalSpent || 0);
  if (budgetLimit > 0 && totalSpent >= budgetLimit) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (ad.startDate && today < ad.startDate) return false;
  if (ad.endDate && today > ad.endDate) return false;
  return true;
}

async function readMarketplaceAds() {
  const selectRes = await supabase
    .from("promotions")
    .select("id, description")
    .eq("title", SYSTEM_ADS_TITLE)
    .maybeSingle();

  if (selectRes.error) throw selectRes.error;

  let ads: any[] = [];
  if (selectRes.data?.description) {
    try {
      const parsed = JSON.parse(selectRes.data.description);
      ads = Array.isArray(parsed) ? parsed : [];
    } catch {
      ads = [];
    }
  }

  return { rowId: selectRes.data?.id, ads };
}

async function saveMarketplaceAds(rowId: string | undefined, ads: any[]) {
  const payload = {
    title: SYSTEM_ADS_TITLE,
    description: JSON.stringify(ads),
    visible: false,
  };

  if (rowId) {
    const updateRes = await supabase.from("promotions").update(payload).eq("id", rowId);
    if (updateRes.error) throw updateRes.error;
    return;
  }

  const insertRes = await supabase.from("promotions").insert([payload]);
  if (insertRes.error) throw insertRes.error;
}

// POST /api/ads/track
// Billable marketplace ad tracking. Impressions are analytics-only; clicks debit
// the ad campaign CPC budget using bidAmount and totalSpent.
router.post("/track", async (req, res) => {
  try {
    const { adId, action, visitorId } = req.body || {};
    const normalizedAction = String(action || "").toLowerCase();

    if (!adId || !["impression", "click"].includes(normalizedAction)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_AD_TRACKING_PAYLOAD",
      });
    }

    const { rowId, ads } = await readMarketplaceAds();
    const index = ads.findIndex((item) => item?.id === adId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "AD_NOT_FOUND",
      });
    }

    const ad = {
      ...ads[index],
      metrics: {
        impressions: Number(ads[index]?.metrics?.impressions || 0),
        clicks: Number(ads[index]?.metrics?.clicks || 0),
        ctr: Number(ads[index]?.metrics?.ctr || 0),
      },
      totalSpent: Number(ads[index]?.totalSpent || 0),
    };

    const activeForBilling = isBillableAd(ad);
    let billedAmount = 0;

    if (normalizedAction === "impression") {
      if (activeForBilling) {
        ad.metrics.impressions += 1;
      }
    } else if (normalizedAction === "click") {
      if (activeForBilling) {
        ad.metrics.clicks += 1;
        const bidAmount = Math.max(0, Number(ad.bidAmount || 0));
        const budgetLimit = Math.max(0, Number(ad.budgetLimit || 0));
        const remainingBudget = budgetLimit > 0 ? Math.max(0, budgetLimit - ad.totalSpent) : bidAmount;
        billedAmount = Math.min(bidAmount, remainingBudget);
        ad.totalSpent += billedAmount;

        if (budgetLimit > 0 && ad.totalSpent >= budgetLimit) {
          ad.status = "completed";
        }
      }
    }

    ad.metrics.ctr =
      ad.metrics.impressions > 0
        ? Number(((ad.metrics.clicks / ad.metrics.impressions) * 100).toFixed(2))
        : 0;
    ad.lastTrackedAt = new Date().toISOString();
    ad.lastTrackedVisitorId = typeof visitorId === "string" ? visitorId.slice(0, 128) : undefined;

    ads[index] = ad;
    await saveMarketplaceAds(rowId, ads);

    res.json({
      success: true,
      data: {
        adId,
        action: normalizedAction,
        billable: normalizedAction === "click" && billedAmount > 0,
        billedAmount,
        totalSpent: ad.totalSpent,
        budgetLimit: ad.budgetLimit,
        metrics: ad.metrics,
        status: ad.status,
      },
    });
  } catch (error: any) {
    console.error("POST /api/ads/track error:", error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to track marketplace ad",
    });
  }
});

export default router;

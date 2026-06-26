import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

router.get("/pilot_scan", async (req, res) => {
  try {
    const result = await supabase.from('promotions').select('description').eq('title', 'SYSTEM_AI_PILOT_SETTINGS').maybeSingle();
    let settings = { autoApprove: true, autoCategorize: true, autoMessage: true, smartPromotion: true, securityMonitor: true };
    if (result.data && result.data.description) {
      try {
        settings = { ...settings, ...JSON.parse(result.data.description) };
      } catch(e) {}
    }

    const { data: dbProducts } = await supabase.from('products').select('id, category, seller_id');
    const { data: dbSellers } = await supabase.from('sellers').select('id');
    const { data: dbOrders } = await supabase.from('orders').select('id, status, created_at').eq('status', 'pending');
    const { data: dbMessages } = await supabase.from('messages').select('id, message');

    const pList = dbProducts || [];
    const sList = dbSellers || [];
    const oList = dbOrders || [];
    const mList = dbMessages || [];

    const categorizedCount = pList.filter((p: any) => !!p.category).length;
    const suspiciousKeywords = ["whatsapp", "+255", "namba", "malipo", "pesa", "lipa", "number", "phone", "external"];
    const suspectMessages = settings.securityMonitor ? mList.filter((m: any) => suspiciousKeywords.some(kw => m.message?.toLowerCase().includes(kw))) : [];
    const inactiveSellersCount = sList.filter((s: any) => pList.filter((p: any) => p.seller_id === s.id).length === 0).length;

    res.json({
      success: true,
      metrics: {
        categorizedCount,
        pendingOrdersCount: oList.length,
        lastPendingDts: oList.length > 0 && oList[0].created_at ? oList[0].created_at : new Date().toISOString(),
        suspectMessagesCount: suspectMessages.length,
        totalMessagesCount: mList.length,
        sellersCount: sList.length,
        inactiveSellersCount
      },
      settings
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

export default router;

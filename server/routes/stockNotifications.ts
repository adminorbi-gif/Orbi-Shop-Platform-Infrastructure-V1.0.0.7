import { Router } from "express";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/stock-notifications - Fetch all alert logs
router.get("/", async (req, res) => {
  try {
    const { data, error } = await getSupabase(req).from('stock_notifications').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;

    const mapped = (data || []).map(sn => ({
       id: sn.id,
       productId: sn.product_id,
       email: sn.email || null,
       phoneNumber: sn.phone_number,
       notified: sn.notified,
       notifiedAt: sn.notified_at ? new Date(sn.notified_at).getTime() : null,
       lastError: sn.last_error || null,
       createdAt: new Date(sn.created_at).getTime()
    }));
    res.json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/stock-notifications - Create alert entry
router.post("/", async (req, res) => {
  try {
    const { productId, email, phone, phoneNumber } = req.body;
    const normalizedPhone = phoneNumber || phone || null;
    let insertRes = await getSupabase(req).from('stock_notifications').insert([{
       product_id: productId,
       phone_number: normalizedPhone,
       email: email || null
    }]);
    if (insertRes.error && String(insertRes.error.message || "").toLowerCase().includes("email")) {
      insertRes = await getSupabase(req).from('stock_notifications').insert([{
        product_id: productId,
        phone_number: normalizedPhone || email || null
      }]);
    }
    const { error } = insertRes;
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/stock-notifications/:id/notified - Update to notified status
router.post("/:id/notified", async (req, res) => {
  try {
    const { id } = req.params;
    let { error } = await getSupabase(req)
      .from('stock_notifications')
      .update({ notified: true, notified_at: new Date().toISOString(), last_error: null })
      .eq('id', id);
    if (error) {
      const retry = await getSupabase(req).from('stock_notifications').update({ notified: true }).eq('id', id);
      error = retry.error;
    }
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

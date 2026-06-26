import { Router } from "express";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/stock-notifications - Fetch all alert logs
router.get("/", async (req, res) => {
  try {
    const { data, error } = await getSupabase(req).from('stock_notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map(sn => ({
       id: sn.id,
       productId: sn.product_id,
       phoneNumber: sn.phone_number,
       notified: sn.notified,
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
    const { productId, phoneNumber } = req.body;
    const { error } = await getSupabase(req).from('stock_notifications').insert([{
       product_id: productId,
       phone_number: phoneNumber
    }]);
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
    const { error } = await getSupabase(req).from('stock_notifications').update({ notified: true }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

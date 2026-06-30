import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

// POST /api/v1/price-alerts - Create price drop alert entry
router.post("/", async (req, res) => {
  try {
    const { productId, email, phone } = req.body;
    const { error } = await getSupabase(req).from('price_alerts').insert([{
       product_id: productId,
       email: email || null,
       phone: phone || null,
       notified: false
    }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

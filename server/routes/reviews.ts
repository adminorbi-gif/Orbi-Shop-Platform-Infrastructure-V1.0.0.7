import { Router } from "express";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/reviews - Retrieve reviews for a product
router.get("/", async (req, res) => {
  try {
    const productId = req.query.productId as string | undefined;
    let query = getSupabase(req).from('reviews').select('*');
    if (productId) {
      query = query.eq('product_id', productId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map(r => ({
      id: r.id,
      productId: r.product_id,
      userName: r.customer_name || 'Mteja',
      rating: r.rating,
      comment: r.comment || '',
      createdAt: new Date(r.created_at).getTime()
    }));
    res.json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/reviews - Write new review on a product
router.post("/", async (req, res) => {
  try {
    const review = req.body;
    const payload = {
      product_id: review.productId,
      customer_name: review.customerName,
      rating: review.rating,
      comment: review.comment
    };
    const { data, error } = await getSupabase(req).from('reviews').insert([payload]).select().single();
    if (error) throw error;
    
    const saved = {
      id: data.id,
      userName: data.customer_name,
      rating: data.rating,
      comment: data.comment || '',
      createdAt: new Date(data.created_at).getTime()
    };
    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

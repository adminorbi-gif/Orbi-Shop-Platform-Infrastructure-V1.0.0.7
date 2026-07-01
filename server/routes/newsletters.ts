import { Router } from "express";
import { supabase, getSupabase } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/newsletters - Get newsletters listed
router.get("/", async (req, res) => {
  try {
    const { data, error } = await getSupabase(req).from('newsletters').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/newsletters/subscribe - Subscribe new email log
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await getSupabase(req).from('newsletters').insert([{ email }]);
    if (error && error.code !== '23505') throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

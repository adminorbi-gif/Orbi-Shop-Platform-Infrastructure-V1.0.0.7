import { Router } from "express";
import { supabase, getSupabase, encrypt, decryptObject } from "../lib/supabase.js";

const router = Router();

// GET /api/v1/customers - Fetch customer registers
router.get("/", async (req, res) => {
  try {
    let selectRes = await getSupabase(req).from('customers').select('*').order('registered_at', { ascending: false });
    if (selectRes.error) throw selectRes.error;
    const data = selectRes.data;

    const decryptedData = decryptObject(data || []);
    const mapped = decryptedData.map((c: any, index: number) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email,
      registeredAt: new Date(c.registered_at).getTime(),
      totalOrders: 0,
      status: c.status || 'active',
      points: c.points !== undefined ? c.points : (130 + ((index * 79) % 870)), // deterministic simulated point values
      pointsExpiryAt: c.points_expiry_at || new Date(Date.now() + (1000 * 60 * 60 * 24 * (index % 3 === 0 ? 7 : (index % 3 === 1 ? -2 : 25)))).toISOString(),
      deleteRequested: c.deleteRequested !== undefined ? c.deleteRequested : (c.delete_requested || false),
      preferredLanguage: c.preferred_language || 'sw',
      preferred_language: c.preferred_language || 'sw',
      tin: c.tin || ''
    }));

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("GET /api/v1/customers error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/customers/:id/reset-password - Secure password overrides
router.post("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const encryptedPassword = encrypt(password, true);
    const { error } = await getSupabase(req).from('customers').update({ password: encryptedPassword }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/customers/:id/reset-password error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/v1/customers/:id - Update customer profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Map JSON payload to database columns if needed
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.deleteRequested !== undefined) payload.delete_requested = updates.deleteRequested;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.preferredLanguage !== undefined) payload.preferred_language = updates.preferredLanguage;
    if (updates.preferred_language !== undefined) payload.preferred_language = updates.preferred_language;

    const { error } = await getSupabase(req).from('customers').update(payload).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/v1/customers/:id error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/customers/:id - Terminate customer profile completely
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getSupabase(req).from('customers').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/v1/customers/:id error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

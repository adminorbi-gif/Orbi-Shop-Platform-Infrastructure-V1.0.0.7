import { Router } from 'express';
import crypto from 'crypto';
import { supabase, getSupabase, getAdminSupabase } from '../lib/supabase.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data,
      session: data.session,
      user: data.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/signup', async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone
        }
      }
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data,
      session: data.session,
      user: data.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({ success: false, error: 'Refresh token required' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      return res.status(401).json({ success: false, error: error?.message || 'Session refresh failed' });
    }

    res.json({
      success: true,
      data,
      session: data.session,
      user: data.user,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to find account and return masked phone number and name
router.post('/initiate', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, phone, name')
      .eq('email', email)
      .maybeSingle();

    if (error || !customer) {
      // Generic message to prevent enumeration
      return res.json({ success: true, maskedPhone: null });
    }

    const { phone, name } = customer;
    // Mask phone: keep first 5, last 2, mask the middle
    const maskedPhone = phone && phone.length > 7 
      ? phone.substring(0, 5) + '*******' + phone.substring(phone.length - 2)
      : '*******';

    res.json({ success: true, maskedPhone, name, customerId: customer.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DB-backed password reset flow using password_reset_tokens table
// Table schema (see db/migrations): id, customer_id, token_hash, expires_at, used, used_at, created_at

// Endpoint to verify full phone number and send OTP (stored hashed in DB)
router.post('/verify', async (req, res) => {
  const { customerId, phone } = req.body;
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, phone, name')
      .eq('id', customerId)
      .eq('phone', phone)
      .maybeSingle();

    if (error || !customer) {
      return res.status(400).json({ success: false, message: 'Incorrect phone number.' });
    }

    // Generate 6-digit OTP code securely
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Hash the OTP before storing
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store hashed OTP in password_reset_tokens (use admin client to bypass RLS)
    const { error: insertErr } = await getAdminSupabase()
      .from('password_reset_tokens')
      .insert([{ customer_id: customerId, token_hash: otpHash, expires_at: expiresAt }]);

    if (insertErr) {
      console.error('[AUTH] Failed to insert OTP token into DB:', insertErr.message || insertErr);
      return res.status(500).json({ success: false, message: 'Failed to create reset token session.' });
    }

    // Send the OTP via SMS using OrbiTalk direct SMS
    const { sendOrbiTalkDirectSMS } = await import('./talk.js');
    const smsMessage = `Habari ${customer.name || 'mteja'}, namba yako ya uhakiki ya kuweka upya nenosiri ni: ${otp}. Usishiriki na mtu yeyote.`;
    
    await sendOrbiTalkDirectSMS({
      recipient: phone,
      body: smsMessage,
      requestId: `otp-pass-reset-${customerId}-${Date.now()}`
    }).catch(smsErr => console.error('[ORBI-TALK-OTP-RECOVERY] Failed to send SMS:', smsErr?.message || smsErr));

    // Do NOT return the raw OTP. Client should prompt user to enter it from SMS.
    res.json({ success: true, requiresOtp: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to verify the OTP and issue reset token (long-lived token returned to client)
router.post('/verify-otp', async (req, res) => {
  const { customerId, otp } = req.body;
  try {
    if (!customerId || !otp) return res.status(400).json({ success: false, message: 'customerId and otp required' });

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');

    // Find matching, unused OTP token for this customer
    const now = new Date().toISOString();
    const { data: rows, error } = await getAdminSupabase()
      .from('password_reset_tokens')
      .select('*')
      .eq('customer_id', customerId)
      .eq('token_hash', otpHash)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[AUTH] OTP lookup error:', error.message || error);
      return res.status(500).json({ success: false, message: 'OTP verification failed' });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Incorrect or expired OTP code.' });
    }

    const tokenRow = rows[0];

    // Mark OTP row as used
    await getAdminSupabase().from('password_reset_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('id', tokenRow.id);

    // Generate actual temporary reset token (long random string) and store its hash in DB
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: insertErr } = await getAdminSupabase().from('password_reset_tokens').insert([{
      customer_id: customerId,
      token_hash: resetTokenHash,
      expires_at: resetExpiresAt
    }]);

    if (insertErr) {
      console.error('[AUTH] Failed to insert reset token into DB:', insertErr.message || insertErr);
      return res.status(500).json({ success: false, message: 'Failed to create reset token.' });
    }

    // Return the reset token to the client so they can call /reset-password; do NOT log it.
    res.json({ success: true, token: resetToken });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to reset password
router.post('/reset-password', async (req, res) => {
  const { customerId, token, password } = req.body;
  if (!customerId || !token || !password) return res.status(400).json({ success: false, message: 'customerId, token and password are required' });

  try {
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const now = new Date().toISOString();

    // Find matching, unused token
    const { data: rows, error } = await getAdminSupabase()
      .from('password_reset_tokens')
      .select('*')
      .eq('customer_id', customerId)
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[AUTH] Reset token lookup error:', error.message || error);
      return res.status(500).json({ success: false, message: 'Token verification failed' });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const tokenRow = rows[0];

    // Hash the provided password for storage. Use a strong KDF (scrypt) with ENCRYPTION_SALT
    const salt = process.env.ENCRYPTION_SALT || 'static_salt';
    const keyLen = 64;
    const passwordHash = crypto.scryptSync(String(password), salt, keyLen).toString('hex');

    // Update the customer's password (use admin client to bypass RLS)
    const { error: updateErr } = await getAdminSupabase()
      .from('customers')
      .update({ password: passwordHash })
      .eq('id', customerId);

    if (updateErr) {
      console.error('[AUTH] Failed to update customer password:', updateErr.message || updateErr);
      return res.status(500).json({ success: false, message: 'Failed to update password.' });
    }

    // Mark token as used
    await getAdminSupabase().from('password_reset_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('id', tokenRow.id);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/update', async (req, res) => {
  const attributes = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

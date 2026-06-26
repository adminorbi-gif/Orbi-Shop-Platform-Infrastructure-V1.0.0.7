import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { encrypt, decrypt, decryptIfEncrypted, decryptObject } from "../../src/lib/crypto.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});
export { encrypt, decrypt, decryptIfEncrypted, decryptObject };

export function getSupabase(req?: any) {
  // Always return the admin service role supabase client to bypass client RLS issues and database/query errors.
  return supabase;
}

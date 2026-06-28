import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { encrypt, decrypt, decryptIfEncrypted, decryptObject } from "../../src/lib/crypto.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is required.");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is required.");
}

if (!supabaseServiceRoleKey && process.env.NODE_ENV === "production") {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in production.");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  realtime: {
    transport: ws as any,
  },
});

export function getUserSupabase(req?: any) {
  const authHeader = req?.headers?.authorization || "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    realtime: {
      transport: ws as any,
    },
  });
}

export function getAdminSupabase() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin database access.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    realtime: {
      transport: ws as any,
    },
  });
}

// Temporary compatibility alias.
// Later, replace route usages carefully with getUserSupabase or getAdminSupabase.
export function getSupabase(req?: any) {
  return getUserSupabase(req);
}

export { encrypt, decrypt, decryptIfEncrypted, decryptObject };

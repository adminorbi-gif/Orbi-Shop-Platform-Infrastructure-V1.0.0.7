import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { encrypt, decrypt, decryptIfEncrypted, decryptObject } from "../../src/lib/crypto.js";

const getSupabaseUrl = () => (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string;
const getSupabaseAnonKey = () => (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) as string;
const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!target.client) {
      const url = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();
      const serviceRoleKey = getSupabaseServiceRoleKey();
      
      if (!url || !anonKey) {
        throw new Error("Missing required Supabase frontend environment variables.");
      }
      target.client = createClient(url, serviceRoleKey || anonKey, {
        realtime: {
          transport: ws as any,
        },
      });
    }
    return target.client[prop];
  }
});

export function getUserSupabase(req?: any) {
  let authHeader = req?.headers?.authorization || "";
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "").trim();
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          authHeader = "";
        }
      }
    } catch (e) {}
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Missing required Supabase frontend environment variables.");
  }

  return createClient(url, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    realtime: {
      transport: ws as any,
    },
  });
}

export function getAdminSupabase() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey || !url) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and URL are required for admin database access.");
  }

  return createClient(url, serviceRoleKey, {
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

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { encrypt, decrypt, decryptIfEncrypted, decryptObject } from "../../src/lib/crypto.js";

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string;
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing required Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === "production") {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is missing in production. Using fallback anon key.");
}

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!target.client) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing required Supabase frontend environment variables.");
      }
      target.client = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
        realtime: {
          transport: ws as any,
        },
      });
    }
    return target.client[prop];
  }
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

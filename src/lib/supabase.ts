/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Proxies all DB HTTP fetch requests through backend API securely
const customProxyFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  let serializedHeaders: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        serializedHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        serializedHeaders[key] = value;
      });
    } else {
      serializedHeaders = options.headers as Record<string, string>;
    }
  }

  const safeOptions = {
    ...options,
    headers: serializedHeaders
  };

  const payload = { url: url.toString(), options: safeOptions };

  try {
    return await fetch('/api/db/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    console.warn("[supabaseProxyFetch] Network check warning: Failed to fetch, returning offline fallback response", err.message || err);
    return new Response(JSON.stringify({ error: true, message: err.message || "Network offline" }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required Supabase frontend environment variables.");
    }
    
    if (!target.client) {
      target.client = createClient(supabaseUrl, supabaseKey, {
        global: {
          fetch: customProxyFetch
        }
      });
    }
    return target.client[prop];
  }
});

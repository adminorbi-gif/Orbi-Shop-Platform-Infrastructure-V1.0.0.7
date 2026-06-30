/// <reference types="vite/client" />

// Database direct access is disabled from browser. Use backend API.
export const supabase = new Proxy({} as any, {
  get: () => {
    throw new Error("Database direct access is disabled from browser. Use backend API.");
  }
});

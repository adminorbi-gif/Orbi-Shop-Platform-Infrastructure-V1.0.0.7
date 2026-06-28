import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Missing required Supabase frontend environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});

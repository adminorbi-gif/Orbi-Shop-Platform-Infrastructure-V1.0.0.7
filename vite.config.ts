import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.warn("WARNING: Missing required Supabase environment variables during build. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are available at runtime.");
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});

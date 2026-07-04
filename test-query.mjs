import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { data, error } = await supabase
  .from("orders")
  .select("id, legacy_id, payment_reference, payment_method, total, status, created_at, customer_name")
  .order("created_at", { ascending: false });
console.log("Error:", error);

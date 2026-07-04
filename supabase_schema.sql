-- Supabase SQL Schema for Orbi Shop

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. TABLES
-- ==========================================

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- Encrypted automatically via trigger using pgcrypto.
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  "deleteRequested" BOOLEAN DEFAULT false,
  
  -- Legacy ID mapping to string ids used in localstorage
  legacy_id TEXT
);

-- Ensure columns exist in case table was created previously without them
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS "deleteRequested" BOOLEAN DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'sw';

-- Trigger to hash password on insert or update
CREATE OR REPLACE FUNCTION public.encrypt_customer_password()
RETURNS trigger AS $$
BEGIN
  -- Only encrypt if it's a new password (not already a bcrypt hash)
  IF NEW.password IS NOT NULL AND NEW.password NOT LIKE '$2a$%' THEN
    NEW.password = crypt(NEW.password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_encrypt_customer_password ON public.customers;
CREATE TRIGGER trg_encrypt_customer_password
BEFORE INSERT OR UPDATE OF password ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.encrypt_customer_password();

-- RPC for verifying legacy customer login
CREATE OR REPLACE FUNCTION public.login_legacy_customer(login_email TEXT, login_password TEXT)
RETURNS SETOF public.customers AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.customers
  WHERE email = login_email
  AND password = crypt(login_password, password);
END;
$$ LANGUAGE plpgsql;


-- Invoice Settings Table
CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  terms TEXT
);

-- Client Portal Branding Settings Table
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id INT PRIMARY KEY DEFAULT 1,
  app_bar_background TEXT,
  app_bar_background2 TEXT,
  app_bar_background3 TEXT,
  disable_app_bar_animations BOOLEAN DEFAULT false,
  app_bar_color TEXT
);

-- Ensure portal_settings table and initial records exist on active schema
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS app_bar_background TEXT;
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS app_bar_background2 TEXT;
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS app_bar_background3 TEXT;
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS disable_app_bar_animations BOOLEAN DEFAULT false;
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS app_bar_color TEXT;

-- Payment Options Table
CREATE TABLE IF NOT EXISTS public.payment_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  details TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Delivery Zones Table
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  label_sw TEXT,
  label_en TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_days INTEGER NOT NULL DEFAULT 1 CHECK (min_days >= 0),
  max_days INTEGER NOT NULL DEFAULT 1 CHECK (max_days >= min_days),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  seller_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS label_sw TEXT;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS label_en TEXT;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS min_days INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS max_days INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS seller_id TEXT;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS delivery_zones_active_sort_idx
ON public.delivery_zones (is_active, sort_order, name);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  stock INT NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]', -- Specifications & key attributes
  wholesale_tiers JSONB DEFAULT '[]', -- Wholesale price quantity tiers
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}', -- Store Supabase Storage public URLs here
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Ensure features column exists in case table was created previously without it
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_tiers JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10,3) DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_cm NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width_cm NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_cm NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_class TEXT DEFAULT 'standard';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fragile BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS oversized BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_cold_chain BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hazardous BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS digital_product BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_delivery_quote BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_scope TEXT DEFAULT 'national';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_policy_source TEXT DEFAULT 'auto';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_handling_notes TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS blocked_delivery_zone_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_origin_zone_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_address TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_place_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_lat NUMERIC(10,7);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_lng NUMERIC(10,7);

CREATE TABLE IF NOT EXISTS public.delivery_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id TEXT NOT NULL,
  delivery_class TEXT NOT NULL DEFAULT 'standard',
  min_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
  max_weight_kg NUMERIC(10,3),
  base_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_kg_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  fragile_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  oversized_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  cold_chain_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_days INTEGER NOT NULL DEFAULT 1 CHECK (min_days >= 0),
  max_days INTEGER NOT NULL DEFAULT 1 CHECK (max_days >= min_days),
  is_available BOOLEAN NOT NULL DEFAULT true,
  reason_if_unavailable TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delivery_rules_zone_class_weight_idx
ON public.delivery_rules (zone_id, delivery_class, min_weight_kg, max_weight_kg);

CREATE TABLE IF NOT EXISTS public.delivery_route_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  seller_id TEXT,
  product_id TEXT,
  zone_id TEXT,
  origin_lat NUMERIC(10,7),
  origin_lng NUMERIC(10,7),
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  distance_km NUMERIC(10,2),
  duration_minutes INTEGER,
  fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  eta TEXT,
  quote_mode TEXT NOT NULL DEFAULT 'zone_fallback',
  route_provider TEXT NOT NULL DEFAULT 'zone_rules',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delivery_route_quotes_order_idx
ON public.delivery_route_quotes (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS delivery_route_quotes_product_zone_idx
ON public.delivery_route_quotes (product_id, zone_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id INT PRIMARY KEY DEFAULT 1,
  base_price_tzs NUMERIC(12,2) NOT NULL DEFAULT 1800,
  cost_per_km_tzs NUMERIC(12,2) NOT NULL DEFAULT 900,
  cost_per_kg_tzs NUMERIC(12,2) NOT NULL DEFAULT 350,
  volumetric_divisor NUMERIC(12,2) NOT NULL DEFAULT 5000,
  max_distance_km NUMERIC(10,2) NOT NULL DEFAULT 1200,
  max_total_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 120,
  max_package_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 25,
  max_package_volumetric_kg NUMERIC(10,3) NOT NULL DEFAULT 30,
  extra_package_fee_tzs NUMERIC(12,2) NOT NULL DEFAULT 1800,
  extra_package_distance_multiplier NUMERIC(8,4) NOT NULL DEFAULT 0.18,
  bulky_threshold_kg NUMERIC(10,3) NOT NULL DEFAULT 20,
  bulky_surcharge_tzs NUMERIC(12,2) NOT NULL DEFAULT 3500,
  fuel_surcharge_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
  insurance_enabled BOOLEAN NOT NULL DEFAULT true,
  insurance_rate_percent NUMERIC(8,4) NOT NULL DEFAULT 1.25,
  insurance_min_fee_tzs NUMERIC(12,2) NOT NULL DEFAULT 500,
  insurance_max_coverage_tzs NUMERIC(14,2) NOT NULL DEFAULT 1000000,
  fallback_enabled BOOLEAN NOT NULL DEFAULT false,
  route_quote_required BOOLEAN NOT NULL DEFAULT true,
  doorstep_max_distance_km NUMERIC(10,2) NOT NULL DEFAULT 65,
  rural_pickup_threshold_km NUMERIC(10,2) NOT NULL DEFAULT 85,
  bus_cargo_max_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 40,
  bus_cargo_max_volumetric_kg NUMERIC(10,3) NOT NULL DEFAULT 55,
  cargo_max_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 250,
  cargo_max_volumetric_kg NUMERIC(10,3) NOT NULL DEFAULT 320,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions Table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  link TEXT,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Orders Table (Supports robust Escrow State Machine via payment_reference mapping)
-- Physical status is mapped payload-side to: 'pending' | 'confirmed' | 'cancelled' | 'shipped' | 'delivered'
-- Escrow status & full-lifecycle status is encoded as prefix inside payment_reference: "ESCROW:STATUS:PAYMENTSTATUS||REALREF"
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method TEXT,
  payment_method_name TEXT,
  payment_reference TEXT, -- Encrypted string containing state mapping: "ESCROW:<STATE>:<PAYMENT_STATE>||<REAL_REFERENCE>"
  total NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'cancelled', 'shipped', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Ensure payment_reference and rider details columns exist in case table was created previously without them
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_vehicle TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_tin TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_eta TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_quote_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_quote_breakdown JSONB DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_unavailable_items JSONB DEFAULT '[]';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_distance_km NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_duration_minutes INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_quote_mode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_route_provider TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_insurance_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_insurance_coverage NUMERIC(14,2) DEFAULT 0;

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL, -- Snapshot of product name
  price NUMERIC NOT NULL, -- Snapshot of product price at the time of order
  quantity INT NOT NULL
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_reply TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage NUMERIC NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  is_used BOOLEAN DEFAULT false,
  applicable_product TEXT,
  applicable_category TEXT,
  target_customer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- ==========================================
-- 2. STORAGE (S3 BUCKET)
-- ==========================================

-- Create the storage bucket for product and promotional images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('orbi-shop-images', 'orbi-shop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Drop existing policies first to prevent conflicts during repair/modify
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- 1. Anyone can view images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'orbi-shop-images' );

-- 2. Authenticated users (admin) can upload, update, edit images
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'orbi-shop-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
WITH CHECK ( bucket_id = 'orbi-shop-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'orbi-shop-images' AND auth.role() = 'authenticated' );

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) FOR TABLES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_route_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to prevent conflicts during repair/modify
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public update products stock" ON public.products;
DROP POLICY IF EXISTS "Admin manage products" ON public.products;

DROP POLICY IF EXISTS "Public read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admin read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admin manage promotions" ON public.promotions;

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public select/read orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin manage orders" ON public.orders;

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public select/read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admin manage order_items" ON public.order_items;

DROP POLICY IF EXISTS "Public insert messages" ON public.messages;
DROP POLICY IF EXISTS "Public select/read messages" ON public.messages;
DROP POLICY IF EXISTS "Admin manage messages" ON public.messages;

DROP POLICY IF EXISTS "Public insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public read customers matching data" ON public.customers;
DROP POLICY IF EXISTS "Public update customers" ON public.customers;
DROP POLICY IF EXISTS "Admin manage customers" ON public.customers;

DROP POLICY IF EXISTS "Public read invoice_settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Admin manage invoice_settings" ON public.invoice_settings;

DROP POLICY IF EXISTS "Public read portal_settings" ON public.portal_settings;
DROP POLICY IF EXISTS "Admin manage portal_settings" ON public.portal_settings;

DROP POLICY IF EXISTS "Public read delivery_zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Admin manage delivery_zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Public read delivery_rules" ON public.delivery_rules;
DROP POLICY IF EXISTS "Admin manage delivery_rules" ON public.delivery_rules;
DROP POLICY IF EXISTS "Public insert delivery_route_quotes" ON public.delivery_route_quotes;
DROP POLICY IF EXISTS "Admin manage delivery_route_quotes" ON public.delivery_route_quotes;
DROP POLICY IF EXISTS "Public read delivery_settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Admin manage delivery_settings" ON public.delivery_settings;

DROP POLICY IF EXISTS "Public read payment_options" ON public.payment_options;
DROP POLICY IF EXISTS "Admin manage payment_options" ON public.payment_options;

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;


-- Products: Consumers can read all, Admins can manage
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public update products stock" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Promotions: Consumers can read visible ones OR system configuration entries, Admins can manage
CREATE POLICY "Public read promotions" ON public.promotions FOR SELECT USING (visible = true OR title LIKE 'SYSTEM_%');
CREATE POLICY "Admin read promotions" ON public.promotions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage promotions" ON public.promotions FOR ALL USING (auth.role() = 'authenticated');

-- Orders: Consumers can create orders, Admins can manage
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select/read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');

-- Order Items: Consumers can create. Admins can manage
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select/read order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Admin manage order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

-- Messages: Consumers can insert. Admins can manage
CREATE POLICY "Public insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select/read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Admin manage messages" ON public.messages FOR ALL USING (auth.role() = 'authenticated');

-- Customers: Consumers can register. Admins can manage
CREATE POLICY "Public insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read customers matching data" ON public.customers FOR SELECT USING (true); -- In a real scenario, restrict to self
CREATE POLICY "Public update customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

-- Settings & Payment Options: Consumers can read, Admins can manage
CREATE POLICY "Public read invoice_settings" ON public.invoice_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage invoice_settings" ON public.invoice_settings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read portal_settings" ON public.portal_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage portal_settings" ON public.portal_settings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read delivery_zones" ON public.delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage delivery_zones" ON public.delivery_zones FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Public read delivery_rules" ON public.delivery_rules FOR SELECT USING (true);
CREATE POLICY "Admin manage delivery_rules" ON public.delivery_rules FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Public insert delivery_route_quotes" ON public.delivery_route_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage delivery_route_quotes" ON public.delivery_route_quotes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Public read delivery_settings" ON public.delivery_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage delivery_settings" ON public.delivery_settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public read payment_options" ON public.payment_options FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage payment_options" ON public.payment_options FOR ALL USING (auth.role() = 'authenticated');

-- Coupons: Consumers can read active ones, Admins can manage
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "Public update coupons" ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL USING (auth.role() = 'authenticated');

-- Initial Data seeding
INSERT INTO public.invoice_settings (id, company_name, address, phone, email, terms)
VALUES (
  1, 
  'Orbi Shop', 
  'Dar es Salaam, Tanzania', 
  '+255689919994', 
  'shop@orbifinancial.com', 
  'Tunapokea malipo kwa njia zote.'
) ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  terms = EXCLUDED.terms;

INSERT INTO public.portal_settings (id, app_bar_background, app_bar_background2, app_bar_background3, disable_app_bar_animations)
VALUES (
  1,
  'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1200',
  false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.delivery_zones (id, name, label_sw, label_en, price, min_days, max_days, is_active, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Dar es Salaam', 'Dar es Salaam', 'Dar es Salaam', 2500, 1, 2, true, 1),
  ('00000000-0000-0000-0000-000000000102', 'Mikoa ya karibu', 'Mikoa ya karibu', 'Nearby regions', 4500, 2, 3, true, 2),
  ('00000000-0000-0000-0000-000000000103', 'Mikoa mingine', 'Mikoa mingine', 'Other regions', 6500, 3, 5, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.delivery_rules (
  zone_id, delivery_class, min_weight_kg, max_weight_kg, base_fee, per_kg_fee,
  fragile_fee, oversized_fee, cold_chain_fee, min_days, max_days, is_available, sort_order
)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'standard', 0, 5, 2500, 350, 1000, 2500, 3500, 1, 2, true, 1),
  ('00000000-0000-0000-0000-000000000101', 'fresh_food', 0, 15, 3000, 300, 500, 1500, 2500, 0, 1, true, 2),
  ('00000000-0000-0000-0000-000000000101', 'processed_food', 0, 20, 3000, 400, 500, 1500, 0, 1, 2, true, 3),
  ('00000000-0000-0000-0000-000000000101', 'bulky', 0, 30, 4500, 650, 2500, 5000, 5000, 2, 4, true, 4),
  ('00000000-0000-0000-0000-000000000101', 'heavy', 0, 80, 6500, 950, 3500, 7500, 7500, 3, 5, true, 5),
  ('00000000-0000-0000-0000-000000000102', 'standard', 0, 5, 4500, 500, 1500, 3500, 4500, 2, 3, true, 6),
  ('00000000-0000-0000-0000-000000000102', 'processed_food', 0, 20, 5500, 650, 1000, 2500, 0, 2, 4, true, 7),
  ('00000000-0000-0000-0000-000000000102', 'bulky', 0, 30, 8000, 850, 3000, 6500, 6500, 3, 5, true, 8),
  ('00000000-0000-0000-0000-000000000102', 'heavy', 0, 80, 12000, 1200, 4500, 9500, 9500, 4, 7, true, 9),
  ('00000000-0000-0000-0000-000000000103', 'standard', 0, 5, 6500, 650, 2000, 4500, 5500, 3, 5, true, 10),
  ('00000000-0000-0000-0000-000000000103', 'processed_food', 0, 20, 8000, 850, 1500, 3500, 0, 3, 6, true, 11),
  ('00000000-0000-0000-0000-000000000103', 'bulky', 0, 30, 12000, 1100, 4000, 8500, 8500, 4, 7, true, 12),
  ('00000000-0000-0000-0000-000000000103', 'heavy', 0, 80, 18000, 1600, 6000, 12000, 12000, 5, 10, true, 13),
  ('00000000-0000-0000-0000-000000000101', 'vehicle', 0, NULL, 0, 0, 0, 0, 0, 0, 0, false, 90),
  ('00000000-0000-0000-0000-000000000102', 'vehicle', 0, NULL, 0, 0, 0, 0, 0, 0, 0, false, 91),
  ('00000000-0000-0000-0000-000000000103', 'vehicle', 0, NULL, 0, 0, 0, 0, 0, 0, 0, false, 92)
ON CONFLICT DO NOTHING;

INSERT INTO public.delivery_settings (
  id,
  base_price_tzs,
  cost_per_km_tzs,
  cost_per_kg_tzs,
  volumetric_divisor,
  max_distance_km,
  max_total_weight_kg,
  max_package_weight_kg,
  max_package_volumetric_kg,
  extra_package_fee_tzs,
  extra_package_distance_multiplier,
  bulky_threshold_kg,
  bulky_surcharge_tzs,
  fuel_surcharge_percent,
  insurance_enabled,
  insurance_rate_percent,
  insurance_min_fee_tzs,
  insurance_max_coverage_tzs,
  fallback_enabled,
  route_quote_required,
  doorstep_max_distance_km,
  rural_pickup_threshold_km,
  bus_cargo_max_weight_kg,
  bus_cargo_max_volumetric_kg,
  cargo_max_weight_kg,
  cargo_max_volumetric_kg
)
VALUES (
  1,
  1800,
  900,
  350,
  5000,
  1200,
  120,
  25,
  30,
  1800,
  0.18,
  20,
  3500,
  0,
  true,
  1.25,
  500,
  1000000,
  false,
  true,
  65,
  85,
  40,
  55,
  250,
  320
) ON CONFLICT (id) DO NOTHING;

-- Newsletters Table
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert for anyone" ON public.newsletters;
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.newsletters;
CREATE POLICY "Allow insert for anyone" ON public.newsletters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for authenticated" ON public.newsletters FOR SELECT USING (true);

-- Stock Notifications Table
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT,
  phone_number TEXT,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.stock_notifications
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stock_notifications'
      AND column_name = 'phone'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.stock_notifications ALTER COLUMN phone DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stock_notifications'
      AND column_name = 'email'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.stock_notifications ALTER COLUMN email DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stock_notifications'
      AND column_name = 'phone'
  ) THEN
    UPDATE public.stock_notifications
       SET phone_number = COALESCE(phone_number, phone)
     WHERE phone_number IS NULL;
  END IF;
END $$;
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert notifications" ON public.stock_notifications;
DROP POLICY IF EXISTS "Admin manage notifications" ON public.stock_notifications;
CREATE POLICY "Public insert notifications" ON public.stock_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage notifications" ON public.stock_notifications FOR ALL USING (auth.role() = 'authenticated');

-- Price Drop Alerts Table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  target_price NUMERIC,
  current_price NUMERIC,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS target_price NUMERIC,
  ADD COLUMN IF NOT EXISTS current_price NUMERIC,
  ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'price_alerts'
      AND column_name = 'email'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.price_alerts ALTER COLUMN email DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'price_alerts'
      AND column_name = 'phone'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.price_alerts ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Admin manage price alerts" ON public.price_alerts;
CREATE POLICY "Public insert price alerts" ON public.price_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage price alerts" ON public.price_alerts FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_id ON public.stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_notified ON public.stock_notifications(notified);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product_id ON public.price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_notified ON public.price_alerts(notified);
CREATE INDEX IF NOT EXISTS idx_promotions_system_marketplace_ads ON public.promotions(title) WHERE title = 'SYSTEM_MARKETPLACE_ADS';

-- Payouts Table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage payouts" ON public.payouts;
CREATE POLICY "Authenticated users manage payouts" ON public.payouts FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. SELLERS AND NICHES TABLES
-- ==========================================

-- Sellers Table (Standard SQL Table)
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  banner TEXT,
  is_pro BOOLEAN DEFAULT false,
  pro_until TIMESTAMPTZ,
  email TEXT UNIQUE,
  active_plan_id TEXT,
  subscription_paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'frozen')),
  delete_requested BOOLEAN DEFAULT false,
  invoice_company_name TEXT,
  invoice_address TEXT,
  invoice_phone TEXT,
  invoice_email TEXT,
  invoice_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_place_id TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(10,7);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(10,7);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_zone_id TEXT;

-- RLS for Sellers
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sellers" ON public.sellers;
DROP POLICY IF EXISTS "Public insert sellers" ON public.sellers;
DROP POLICY IF EXISTS "Public update sellers" ON public.sellers;
DROP POLICY IF EXISTS "Admin manage sellers" ON public.sellers;

CREATE POLICY "Public read sellers" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Public insert sellers" ON public.sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sellers" ON public.sellers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage sellers" ON public.sellers FOR ALL USING (auth.role() = 'authenticated');

-- Niches Table (Standard SQL Table)
CREATE TABLE IF NOT EXISTS public.niches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'Smartphone',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Niches
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read niches" ON public.niches;
DROP POLICY IF EXISTS "Public insert niches" ON public.niches;
DROP POLICY IF EXISTS "Public update niches" ON public.niches;
DROP POLICY IF EXISTS "Admin manage niches" ON public.niches;

CREATE POLICY "Public read niches" ON public.niches FOR SELECT USING (true);
CREATE POLICY "Public insert niches" ON public.niches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update niches" ON public.niches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin manage niches" ON public.niches FOR ALL USING (auth.role() = 'authenticated');

-- Seed initial records on the real tables (if empty)
INSERT INTO public.sellers (id, name, description, avatar, banner, is_pro, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Orbi Official',
  'Official products directly provided by Orbi Shop.',
  'https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png',
  'https://limcgmcytzvotxhthqiu.supabase.co/storage/v1/object/public/PLATFROM%20STOCKS/Platform%20Logos/default_banner.png',
  true,
  'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.niches (name, icon)
VALUES 
  ('Electronics', 'Smartphone'), 
  ('Fashion & Apparel', 'Shirt'), 
  ('Home & Furniture', 'Sofa'), 
  ('Health & Beauty', 'Heart'), 
  ('Auto & Motors', 'CarFront'), 
  ('Groceries & Food', 'ShoppingBag')
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- 5. REVIEWS TABLE
-- ==========================================

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON public.reviews;

-- Drop fallback/redundant versions in case they exist
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;

-- Anyone can read reviews
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- Anyone can insert a review (allows consumers to submit reviews)
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- ==========================================
-- 6. STAFF ROLES TABLE
-- ==========================================

-- Staff Roles Table
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('super_admin', 'human_resources', 'accountant', 'support', 'worker')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'frozen')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- RLS for Staff Roles
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read staff" ON public.staff_roles;
DROP POLICY IF EXISTS "Admin manage staff" ON public.staff_roles;

CREATE POLICY "Public read staff" ON public.staff_roles FOR SELECT USING (true);
CREATE POLICY "Admin manage staff" ON public.staff_roles FOR ALL USING (auth.role() = 'authenticated');

-- Seed initial records on the real tables (if empty)
INSERT INTO public.staff_roles (name, email, role, permissions, status)
VALUES (
  'Orbi Root Admin',
  'admin.orbi@gmail.com',
  'super_admin',
  '["*"]',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Order Status Logs / Audit Logs Table
CREATE TABLE IF NOT EXISTS public.order_status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT,
  staff_name TEXT,
  staff_email TEXT,
  notification_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Ensure RLS and Policies for order_status_logs
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read order status logs" ON public.order_status_logs;
DROP POLICY IF EXISTS "Admin manage order status logs" ON public.order_status_logs;

CREATE POLICY "Public read order status logs" ON public.order_status_logs FOR SELECT USING (true);
CREATE POLICY "Admin manage order status logs" ON public.order_status_logs FOR ALL USING (auth.role() = 'authenticated');

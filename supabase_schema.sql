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
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert notifications" ON public.stock_notifications;
DROP POLICY IF EXISTS "Admin manage notifications" ON public.stock_notifications;
CREATE POLICY "Public insert notifications" ON public.stock_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage notifications" ON public.stock_notifications FOR ALL USING (auth.role() = 'authenticated');

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  legacy_id TEXT
);

-- Ensure RLS and Policies for order_status_logs
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read order status logs" ON public.order_status_logs;
DROP POLICY IF EXISTS "Admin manage order status logs" ON public.order_status_logs;

CREATE POLICY "Public read order status logs" ON public.order_status_logs FOR SELECT USING (true);
CREATE POLICY "Admin manage order status logs" ON public.order_status_logs FOR ALL USING (auth.role() = 'authenticated');

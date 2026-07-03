-- Production delivery zones: admin-controlled shipping locations, prices, and ETAs.

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

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read delivery_zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Admin manage delivery_zones" ON public.delivery_zones;

CREATE POLICY "Public read delivery_zones"
ON public.delivery_zones FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin manage delivery_zones"
ON public.delivery_zones FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

INSERT INTO public.delivery_zones (id, name, label_sw, label_en, price, min_days, max_days, is_active, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Dar es Salaam', 'Dar es Salaam', 'Dar es Salaam', 2500, 1, 2, true, 1),
  ('00000000-0000-0000-0000-000000000102', 'Mikoa ya karibu', 'Mikoa ya karibu', 'Nearby regions', 4500, 2, 3, true, 2),
  ('00000000-0000-0000-0000-000000000103', 'Mikoa mingine', 'Mikoa mingine', 'Other regions', 6500, 3, 5, true, 3)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_eta TEXT;

-- Orbi Shop Delivery Quote Engine
-- Adds product delivery profiles and rule-based delivery pricing.

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

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_quote_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_quote_breakdown JSONB DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_unavailable_items JSONB DEFAULT '[]';

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

ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read delivery_rules" ON public.delivery_rules;
DROP POLICY IF EXISTS "Admin manage delivery_rules" ON public.delivery_rules;
CREATE POLICY "Public read delivery_rules" ON public.delivery_rules FOR SELECT USING (true);
CREATE POLICY "Admin manage delivery_rules" ON public.delivery_rules FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

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
  ('00000000-0000-0000-0000-000000000103', 'heavy', 0, 80, 18000, 1600, 6000, 12000, 12000, 5, 10, true, 13)
ON CONFLICT DO NOTHING;

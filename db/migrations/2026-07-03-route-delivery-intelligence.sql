-- Route-based delivery intelligence
-- Adds pickup/destination-ready fields so delivery cost can be calculated from real road distance.

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_place_id TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(10,7);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(10,7);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS pickup_zone_id TEXT;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_address TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_place_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_lat NUMERIC(10,7);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_pickup_lng NUMERIC(10,7);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_distance_km NUMERIC(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_duration_minutes INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_quote_mode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_route_provider TEXT;

CREATE TABLE IF NOT EXISTS public.delivery_route_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
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

ALTER TABLE public.delivery_route_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert delivery_route_quotes" ON public.delivery_route_quotes;
DROP POLICY IF EXISTS "Admin manage delivery_route_quotes" ON public.delivery_route_quotes;
CREATE POLICY "Public insert delivery_route_quotes" ON public.delivery_route_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage delivery_route_quotes" ON public.delivery_route_quotes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

INSERT INTO public.delivery_rules (
  zone_id, delivery_class, min_weight_kg, max_weight_kg, base_fee, per_kg_fee,
  fragile_fee, oversized_fee, cold_chain_fee, min_days, max_days, is_available,
  reason_if_unavailable, sort_order
)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'vehicle', 0, NULL, 0, 0, 0, 0, 0, 0, 0, false, 'Vehicle delivery requires a custom quote based on fuel, driver, inspection, and route distance.', 90),
  ('00000000-0000-0000-0000-000000000102', 'vehicle', 0, NULL, 0, 0, 0, 0, 0, 0, 0, false, 'Vehicle delivery requires a custom quote based on fuel, driver, inspection, and route distance.', 91),
  ('00000000-0000-0000-0000-000000000103', 'vehicle', 0, NULL, 0, 0, 0, 0, 0, 0, 0, false, 'Vehicle delivery requires a custom quote based on fuel, driver, inspection, and route distance.', 92)
ON CONFLICT DO NOTHING;

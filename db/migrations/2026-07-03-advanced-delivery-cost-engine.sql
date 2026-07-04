-- Advanced delivery cost engine: global rate card, package splitting, and optional insurance.

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

ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS route_quote_required BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS doorstep_max_distance_km NUMERIC(10,2) NOT NULL DEFAULT 65;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS rural_pickup_threshold_km NUMERIC(10,2) NOT NULL DEFAULT 85;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS bus_cargo_max_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 40;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS bus_cargo_max_volumetric_kg NUMERIC(10,3) NOT NULL DEFAULT 55;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS cargo_max_weight_kg NUMERIC(10,3) NOT NULL DEFAULT 250;
ALTER TABLE public.delivery_settings ADD COLUMN IF NOT EXISTS cargo_max_volumetric_kg NUMERIC(10,3) NOT NULL DEFAULT 320;
ALTER TABLE public.delivery_settings ALTER COLUMN fallback_enabled SET DEFAULT false;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_insurance_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_insurance_coverage NUMERIC(14,2) DEFAULT 0;

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read delivery_settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Admin manage delivery_settings" ON public.delivery_settings;

CREATE POLICY "Public read delivery_settings"
ON public.delivery_settings FOR SELECT
USING (true);

CREATE POLICY "Admin manage delivery_settings"
ON public.delivery_settings FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

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
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.delivery_settings
SET fallback_enabled = false,
    route_quote_required = true
WHERE id = 1
  AND fallback_enabled = true;

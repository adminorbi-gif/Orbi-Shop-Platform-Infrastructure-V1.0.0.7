-- ORBI Shop alert and marketplace ad tracking upgrade
-- Safe to run multiple times. Keeps existing customer alert data intact.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
END $$;

DO $$
BEGIN
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

CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_id
  ON public.stock_notifications(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_notifications_notified
  ON public.stock_notifications(notified);

ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert notifications" ON public.stock_notifications;
DROP POLICY IF EXISTS "Admin manage notifications" ON public.stock_notifications;

CREATE POLICY "Public insert notifications"
  ON public.stock_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin manage notifications"
  ON public.stock_notifications
  FOR ALL
  USING (auth.role() = 'authenticated');

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

CREATE INDEX IF NOT EXISTS idx_price_alerts_product_id
  ON public.price_alerts(product_id);

CREATE INDEX IF NOT EXISTS idx_price_alerts_notified
  ON public.price_alerts(notified);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Admin manage price alerts" ON public.price_alerts;

CREATE POLICY "Public insert price alerts"
  ON public.price_alerts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin manage price alerts"
  ON public.price_alerts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Marketplace ads are stored in promotions as SYSTEM_MARKETPLACE_ADS JSON.
-- This index prevents slow lookup and helps CPC tracking resolve the system row fast.
CREATE INDEX IF NOT EXISTS idx_promotions_system_marketplace_ads
  ON public.promotions(title)
  WHERE title = 'SYSTEM_MARKETPLACE_ADS';

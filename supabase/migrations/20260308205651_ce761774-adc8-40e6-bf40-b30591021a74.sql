CREATE TABLE public.market_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key text NOT NULL UNIQUE,
  location text NOT NULL,
  active_listings integer NOT NULL DEFAULT 0,
  pending_listings integer NOT NULL DEFAULT 0,
  par numeric NOT NULL DEFAULT 0,
  average_days_on_market integer NOT NULL DEFAULT 30,
  median_price numeric NOT NULL DEFAULT 0,
  price_change numeric NOT NULL DEFAULT 0.02,
  sources text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_data_cache_location_key ON public.market_data_cache (location_key);

ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
  ON public.market_data_cache FOR SELECT
  TO anon, authenticated
  USING (true);
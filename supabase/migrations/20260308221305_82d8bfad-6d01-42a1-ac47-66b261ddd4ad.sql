
-- Profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  mao_multiplier numeric NOT NULL DEFAULT 0.70,
  default_vacancy_percent numeric NOT NULL DEFAULT 8,
  default_repairs_percent numeric NOT NULL DEFAULT 5,
  default_capex_percent numeric NOT NULL DEFAULT 5,
  default_management_percent numeric NOT NULL DEFAULT 10,
  default_closing_buy_percent numeric NOT NULL DEFAULT 3,
  default_closing_sell_percent numeric NOT NULL DEFAULT 6,
  default_down_payment_percent numeric NOT NULL DEFAULT 20,
  default_interest_rate numeric NOT NULL DEFAULT 7.0,
  default_loan_term_years integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip_code text NOT NULL DEFAULT '',
  property_type text NOT NULL DEFAULT 'single_family',
  bedrooms integer NOT NULL DEFAULT 3,
  bathrooms numeric NOT NULL DEFAULT 2,
  square_feet integer NOT NULL DEFAULT 1500,
  lot_size numeric,
  year_built integer,
  asking_price numeric NOT NULL DEFAULT 0,
  estimated_arv numeric NOT NULL DEFAULT 0,
  estimated_monthly_rent numeric NOT NULL DEFAULT 0,
  estimated_rehab_low numeric NOT NULL DEFAULT 0,
  estimated_rehab_high numeric NOT NULL DEFAULT 0,
  taxes_annual numeric NOT NULL DEFAULT 0,
  insurance_annual numeric NOT NULL DEFAULT 0,
  hoa_monthly numeric NOT NULL DEFAULT 0,
  vacancy_percent numeric NOT NULL DEFAULT 8,
  repairs_percent numeric NOT NULL DEFAULT 5,
  capex_percent numeric NOT NULL DEFAULT 5,
  property_management_percent numeric NOT NULL DEFAULT 10,
  closing_cost_buy_percent numeric NOT NULL DEFAULT 3,
  closing_cost_sell_percent numeric NOT NULL DEFAULT 6,
  holding_months integer NOT NULL DEFAULT 6,
  down_payment_percent numeric NOT NULL DEFAULT 20,
  interest_rate numeric NOT NULL DEFAULT 7.0,
  loan_term_years integer NOT NULL DEFAULT 30,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own properties" ON public.properties FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties" ON public.properties FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Deal analyses table
CREATE TABLE public.deal_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_price numeric NOT NULL DEFAULT 0,
  down_payment_percent numeric NOT NULL DEFAULT 20,
  interest_rate numeric NOT NULL DEFAULT 7.0,
  loan_term_years integer NOT NULL DEFAULT 30,
  monthly_payment numeric NOT NULL DEFAULT 0,
  monthly_cash_flow numeric NOT NULL DEFAULT 0,
  annual_cash_flow numeric NOT NULL DEFAULT 0,
  cap_rate numeric NOT NULL DEFAULT 0,
  cash_on_cash_return numeric NOT NULL DEFAULT 0,
  total_cash_needed numeric NOT NULL DEFAULT 0,
  rehab_total_low numeric NOT NULL DEFAULT 0,
  rehab_total_high numeric NOT NULL DEFAULT 0,
  flip_profit_low numeric NOT NULL DEFAULT 0,
  flip_profit_high numeric NOT NULL DEFAULT 0,
  mao numeric NOT NULL DEFAULT 0,
  buy_hold_score integer NOT NULL DEFAULT 0,
  flip_score integer NOT NULL DEFAULT 0,
  overall_score integer NOT NULL DEFAULT 0,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON public.deal_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.deal_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.deal_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.deal_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Saved deals table
CREATE TABLE public.saved_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  analysis_id uuid REFERENCES public.deal_analyses(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved deals" ON public.saved_deals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved deals" ON public.saved_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved deals" ON public.saved_deals FOR DELETE TO authenticated USING (auth.uid() = user_id);

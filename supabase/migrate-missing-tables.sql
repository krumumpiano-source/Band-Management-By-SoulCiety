-- ============================================================
-- Migration: เพิ่มตาราง setlists, fund_transactions, external_payouts
-- ============================================================

-- 1. SETLISTS (เซ็ตลิสต์)
CREATE TABLE IF NOT EXISTS public.setlists (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id     text NOT NULL UNIQUE,
  sets_data   jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setlists: เห็นเฉพาะวงตัวเอง"
  ON public.setlists FOR ALL
  USING (band_id = public.get_my_band_id());

-- 2. FUND_TRANSACTIONS (กองกลาง)
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id     text NOT NULL,
  type        text NOT NULL DEFAULT 'income',    -- income / expense
  amount      numeric DEFAULT 0,
  date        text NOT NULL,
  category    text DEFAULT '',
  description text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fund_tx: เห็นเฉพาะวงตัวเอง"
  ON public.fund_transactions FOR ALL
  USING (band_id = public.get_my_band_id());

-- 3. EXTERNAL_PAYOUTS (จ่ายนอก)
CREATE TABLE IF NOT EXISTS public.external_payouts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id     text NOT NULL,
  payee_name  text DEFAULT '',
  payee_type  text DEFAULT '',
  amount      numeric DEFAULT 0,
  date        text DEFAULT '',
  job_id      text DEFAULT '',
  notes       text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.external_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ext_payouts: เห็นเฉพาะวงตัวเอง"
  ON public.external_payouts FOR ALL
  USING (band_id = public.get_my_band_id());

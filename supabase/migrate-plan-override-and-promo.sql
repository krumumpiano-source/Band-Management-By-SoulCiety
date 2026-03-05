-- ════════════════════════════════════════════════════
-- 1) plan_override column on profiles
-- ════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_override TEXT DEFAULT NULL
  CHECK (plan_override IN ('free','lite','pro'));

-- ════════════════════════════════════════════════════
-- 2) promo_codes table
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS promo_codes (
  id               SERIAL PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  plan             TEXT NOT NULL DEFAULT 'lite' CHECK (plan IN ('lite','pro')),
  months           INT  NOT NULL DEFAULT 1 CHECK (months > 0),
  discount_percent INT  NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  max_uses         INT  DEFAULT NULL,   -- NULL = ไม่จำกัด
  used_count       INT  NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ DEFAULT NULL,  -- NULL = ไม่หมดอายุ
  active           BOOL NOT NULL DEFAULT true,
  note             TEXT DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promo_public_read  ON promo_codes;
DROP POLICY IF EXISTS promo_admin_write  ON promo_codes;

-- ทุกคน (login แล้ว) อ่านได้ เพื่อ validate code ตอน checkout
CREATE POLICY promo_public_read ON promo_codes
  FOR SELECT USING (true);

-- เฉพาะ admin เขียน/ลบ/แก้ได้
CREATE POLICY promo_admin_write ON promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

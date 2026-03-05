-- ── migrate-band-plan.sql ──────────────────────────────────────────────
-- เพิ่มคอลัมน์ band_plan ใน table bands
-- ค่า: 'free' | 'lite' | 'pro'  (default = 'free')
-- ─────────────────────────────────────────────────────────────────────────

-- 1. เพิ่มคอลัมน์ (ถ้ายังไม่มี)
ALTER TABLE bands
  ADD COLUMN IF NOT EXISTS band_plan TEXT NOT NULL DEFAULT 'free'
  CHECK (band_plan IN ('free', 'lite', 'pro'));

-- 2. ให้ทุก band ที่สร้างแล้วเป็น 'free' (default ครอบคลุมแล้ว แต่ set ชัดๆ ไว้ก่อน)
UPDATE bands SET band_plan = 'free' WHERE band_plan IS NULL;

-- 3. เพิ่ม index สำหรับ query เร็ว
CREATE INDEX IF NOT EXISTS idx_bands_band_plan ON bands (band_plan);

-- ─────────────────────────────────────────────────────────────────────────
-- หมายเหตุ: ฟิลด์นี้อ่านผ่าน profiles view/join เพื่อส่งกลับ client
-- supabase-api.js / saveSession() จะ set localStorage('band_plan')
-- ─────────────────────────────────────────────────────────────────────────

-- 4. ถ้า login query ดึงจาก profiles table (ไม่ใช่ bands) ให้ expose ผ่าน view หรือ join
--    ตรวจ profiles table ว่ามี band_plan ไหม — ถ้าใช้ join ดึงจาก bands แล้วไม่ต้องทำข้อนี้

-- ตัวอย่าง query ที่ supabase-api.js ควรใช้ตอน login:
-- SELECT p.*, b.band_plan
-- FROM profiles p
-- LEFT JOIN bands b ON b.id = p.band_id
-- WHERE p.id = auth.uid()

-- ─────────────────────────────────────────────────────────────────
-- migrate-equipment-v2.sql
-- เพิ่มฟิลด์ใหม่ในตาราง equipment + สร้าง Storage bucket สำหรับรูปภาพ
-- วิธีใช้: รันใน Supabase Dashboard → SQL Editor (ทีเดียว)
-- ─────────────────────────────────────────────────────────────────

-- ── 1. เพิ่มคอลัมน์ใหม่ ───────────────────────────────────────────
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS purchase_source text,   -- ซื้อจากร้านไหน / แหล่งที่มา
  ADD COLUMN IF NOT EXISTS fund_source      text,   -- เงินจากไหน (กองกลาง / ส่วนตัว / อื่นๆ)
  ADD COLUMN IF NOT EXISTS image_url        text;   -- URL รูปจาก Supabase Storage

-- ── 2. สร้าง Storage bucket ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-images',
  'equipment-images',
  true,          -- public เพื่อแสดงรูปโดยไม่ต้อง auth
  5242880,       -- 5 MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ── 3. RLS policies สำหรับ Storage ────────────────────────────────
-- อ่านได้ทุกคน (public bucket)
CREATE POLICY "equipment-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-images');

-- สมาชิกที่ login แล้วอัพโหลดได้
CREATE POLICY "equipment-images: auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'equipment-images' AND auth.uid() IS NOT NULL);

-- สมาชิกที่ login แล้วแก้ไขได้
CREATE POLICY "equipment-images: auth update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'equipment-images' AND auth.uid() IS NOT NULL);

-- สมาชิกที่ login แล้วลบได้
CREATE POLICY "equipment-images: auth delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'equipment-images' AND auth.uid() IS NOT NULL);

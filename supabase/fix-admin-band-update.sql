-- ============================================================
-- Fix: Admin ไม่สามารถเปลี่ยนแพ็กเกจวงได้ (setBandPlan)
-- ============================================================
-- สาเหตุ: RLS policy "bands: แก้ไขได้เฉพาะ manager" อนุญาตเฉพาะ
--         manager_id = auth.uid() ทำให้ admin ที่ไม่ใช่ manager ของวง
--         update ไม่ได้ (Supabase return 0 rows, ไม่ error)
--
-- วิธีแก้: เพิ่ม policy ให้ admin update bands ได้ทุกวง
-- ============================================================

-- 1. ตรวจว่า function is_admin() มีอยู่แล้ว (ถ้าไม่มีให้สร้าง)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. ลบ policy เก่า (ถ้ามี) แล้วสร้างใหม่
DROP POLICY IF EXISTS "bands: admin จัดการทั้งหมด" ON public.bands;

CREATE POLICY "bands: admin จัดการทั้งหมด"
  ON public.bands
  FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 3. Fix: NOT NULL constraints เพื่อป้องกันข้อมูลเสีย
-- ============================================================

-- band_songs.name — ต้องมีชื่อเพลง
-- อัปเดต NULL ก่อน แล้วเพิ่ม constraint
UPDATE public.band_songs SET name = '(ไม่ระบุชื่อ)' WHERE name IS NULL;
ALTER TABLE public.band_songs ALTER COLUMN name SET NOT NULL;

-- schedule.date — ต้องมีวันที่
DELETE FROM public.schedule WHERE date IS NULL;
ALTER TABLE public.schedule ALTER COLUMN date SET NOT NULL;

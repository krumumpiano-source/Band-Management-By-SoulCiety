-- ============================================================
-- migrate-profiles-v2.sql
-- เพิ่มฟิลด์ข้อมูลส่วนตัว: คำนำหน้า ชื่อ นามสกุล ชื่อเล่น เครื่องดนตรี
-- ============================================================

-- 1. เพิ่ม column ใหม่
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title      text default '',
  ADD COLUMN IF NOT EXISTS first_name text default '',
  ADD COLUMN IF NOT EXISTS last_name  text default '',
  ADD COLUMN IF NOT EXISTS nickname   text default '',
  ADD COLUMN IF NOT EXISTS instrument text default '';

-- 2. อัปเดต trigger ให้รองรับ field ใหม่
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, user_name,
    title, first_name, last_name, nickname, instrument,
    band_id, band_name, role, status
  )
  VALUES (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'first_name',
      split_part(new.email,'@',1)
    ),
    coalesce(new.raw_user_meta_data->>'title',      ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  ''),
    coalesce(new.raw_user_meta_data->>'nickname',   ''),
    coalesce(new.raw_user_meta_data->>'instrument', ''),
    coalesce(new.raw_user_meta_data->>'band_id',    ''),
    coalesce(new.raw_user_meta_data->>'band_name',  ''),
    coalesce(new.raw_user_meta_data->>'role',       'manager'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    user_name  = EXCLUDED.user_name,
    title      = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    nickname   = EXCLUDED.nickname,
    instrument = EXCLUDED.instrument,
    role       = EXCLUDED.role,
    status     = EXCLUDED.status;
  RETURN new;
END;
$$;

-- 3. เพิ่ม policy ให้ admin แก้ไข profile ทุกคนได้ (สำหรับ updateUserProfile)
DROP POLICY IF EXISTS "profiles: insert ตัวเอง" ON public.profiles;
CREATE POLICY "profiles: insert ตัวเอง"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. ตรวจสอบผล
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================
-- Migration: ลืมรหัสผ่าน / ลืมอีเมล
-- เพิ่ม phone column + lookup_email RPC
-- ============================================================

-- 1. เพิ่ม phone ใน profiles (ถ้ายังไม่มี)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '';

-- 2. RPC: lookup_email — ค้นหาอีเมลจากชื่อ/เบอร์โทร (return masked)
CREATE OR REPLACE FUNCTION public.lookup_email(p_name text DEFAULT '', p_phone text DEFAULT '')
RETURNS TABLE(masked_email text, nickname text, band_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name  text := lower(trim(coalesce(p_name, '')));
  v_phone text := regexp_replace(trim(coalesce(p_phone, '')), '[^0-9]', '', 'g');
BEGIN
  IF v_name = '' AND v_phone = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    -- ปิดบังอีเมล: แสดง 2 ตัวแรก + *** + @domain
    CASE
      WHEN p.email IS NOT NULL AND position('@' IN p.email) > 2
      THEN substring(p.email, 1, 2) || repeat('*', GREATEST(position('@' IN p.email) - 3, 1)) || substring(p.email FROM position('@' IN p.email))
      ELSE '***'
    END AS masked_email,
    coalesce(p.nickname, p.user_name, '') AS nickname,
    coalesce(p.band_name, '') AS band_name
  FROM public.profiles p
  WHERE
    (
      v_name <> '' AND (
        lower(coalesce(p.first_name, '')) = v_name
        OR lower(coalesce(p.last_name, ''))  = v_name
        OR lower(coalesce(p.nickname, ''))    = v_name
        OR lower(coalesce(p.user_name, ''))   = v_name
      )
    )
    OR
    (
      v_phone <> '' AND length(v_phone) >= 9
      AND regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = v_phone
    );
END;
$$;

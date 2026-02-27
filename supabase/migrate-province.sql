-- ============================================================
-- migrate-province.sql
-- เพิ่ม province (จังหวัด) ใน bands, profiles, invite_codes
-- อัปเดต RPC: generate_invite_code, redeem_invite_code
-- เพิ่ม RPC: lookup_invite_code (preview ก่อน redeem)
-- ============================================================

-- 1. เพิ่ม column
ALTER TABLE public.bands        ADD COLUMN IF NOT EXISTS province text default '';
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS province text default '';
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS province text default '';

-- 2. generate_invite_code — รับ province ด้วย
CREATE OR REPLACE FUNCTION public.generate_invite_code(
  p_band_id   text,
  p_band_name text,
  p_province  text DEFAULT ''
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code    text := '';
  v_chars   text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_expires timestamptz := now() + interval '7 days';
  i         integer;
BEGIN
  FOR i IN 1..6 LOOP
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
  END LOOP;

  INSERT INTO public.invite_codes (code, band_id, band_name, province, expires_at, status)
  VALUES (v_code, p_band_id, p_band_name, p_province, v_expires, 'active');

  RETURN jsonb_build_object(
    'success',    true,
    'code',       v_code,
    'band_id',    p_band_id,
    'band_name',  p_band_name,
    'province',   p_province,
    'expires_at', v_expires
  );
END;
$$;

-- 3. redeem_invite_code — คัดลอก province ไปยัง profile ด้วย
--    รองรับ status = 'permanent' (รหัสประจำวง) และ 'active' (รหัสเชิญชั่วคราว)
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite public.invite_codes%rowtype;
  v_used   text;
BEGIN
  SELECT * INTO v_invite
  FROM public.invite_codes
  WHERE upper(code) = upper(p_code) AND status IN ('active', 'permanent')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรหัสวง หรือรหัสไม่ถูกต้อง');
  END IF;

  -- ตรวจวันหมดอายุ (เฉพาะ active — permanent ไม่มี expires_at)
  IF v_invite.status = 'active' AND v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    UPDATE public.invite_codes SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'message', 'รหัสเชิญหมดอายุแล้ว');
  END IF;

  -- อัปเดต profile → role = 'pending' (รออนุมัติ)
  UPDATE public.profiles
  SET band_id   = v_invite.band_id,
      band_name = v_invite.band_name,
      province  = v_invite.province,
      role      = 'pending'
  WHERE id = p_user_id;

  -- บันทึกการใช้ code
  v_used := coalesce(v_invite.used_by, '') ||
            CASE WHEN v_invite.used_by IS NOT NULL AND v_invite.used_by != '' THEN ',' ELSE '' END ||
            p_user_id::text;
  UPDATE public.invite_codes SET used_by = v_used WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success',   true,
    'band_id',   v_invite.band_id,
    'band_name', v_invite.band_name,
    'province',  v_invite.province,
    'message',   'ส่งคำขอเข้าร่วมวงแล้ว รอผู้จัดการวงอนุมัติ'
  );
END;
$$;

-- 4. lookup_invite_code — preview ข้อมูลวงก่อน redeem (ไม่เปลี่ยน state)
--    รองรับ status = 'permanent' (รหัสประจำวง) และ 'active' (รหัสเชิญชั่วคราว)
CREATE OR REPLACE FUNCTION public.lookup_invite_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite public.invite_codes%rowtype;
  v_member_count integer;
BEGIN
  SELECT * INTO v_invite
  FROM public.invite_codes
  WHERE upper(code) = upper(p_code) AND status IN ('active', 'permanent')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรหัสวง หรือรหัสไม่ถูกต้อง');
  END IF;

  IF v_invite.status = 'active' AND v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'message', 'รหัสเชิญหมดอายุแล้ว');
  END IF;

  SELECT count(*) INTO v_member_count
  FROM public.profiles
  WHERE band_id = v_invite.band_id AND role IN ('member', 'manager', 'admin');

  RETURN jsonb_build_object(
    'success',      true,
    'band_id',      v_invite.band_id,
    'band_name',    v_invite.band_name,
    'province',     v_invite.province,
    'member_count', v_member_count
  );
END;
$$;

-- 5. ตรวจสอบผล
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bands'
  AND column_name = 'province';

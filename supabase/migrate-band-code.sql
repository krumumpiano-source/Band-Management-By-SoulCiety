-- ============================================================
-- migrate-band-code.sql
-- เปลี่ยนระบบ "รหัสเชิญ" (7 วัน) → "รหัสประจำวง" (ถาวร)
-- + ระบบอนุมัติสมาชิก (pending → member)
-- ============================================================

-- 1. เพิ่ม status = 'pending' ให้ profiles รองรับ
--    (profiles.role จากเดิม 'member' เปลี่ยนเป็น 'pending' ตอน redeem)
--    manager จะเปลี่ยนเป็น 'member' เมื่ออนุมัติ

-- 2. สร้าง/อัปเดต band_code — ออกครั้งเดียว ใช้ได้ตลอด
CREATE OR REPLACE FUNCTION public.generate_band_code(
  p_band_id   text,
  p_band_name text,
  p_province  text DEFAULT ''
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code    text := '';
  v_chars   text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_existing text;
  i         integer;
BEGIN
  -- ตรวจว่ามีรหัสประจำวงอยู่แล้วหรือไม่
  SELECT code INTO v_existing
  FROM public.invite_codes
  WHERE band_id = p_band_id AND status = 'permanent'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success',   true,
      'code',      v_existing,
      'band_id',   p_band_id,
      'band_name', p_band_name,
      'province',  p_province,
      'message',   'ใช้รหัสประจำวงเดิม'
    );
  END IF;

  -- สร้าง random code 6 ตัว
  FOR i IN 1..6 LOOP
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
  END LOOP;

  -- ปิดรหัสเก่าทั้งหมดของวงนี้
  UPDATE public.invite_codes SET status = 'expired'
  WHERE band_id = p_band_id AND status IN ('active', 'permanent');

  -- สร้างรหัสใหม่แบบถาวร (ไม่มีวันหมดอายุ)
  INSERT INTO public.invite_codes (code, band_id, band_name, province, expires_at, status)
  VALUES (v_code, p_band_id, p_band_name, p_province, NULL, 'permanent');

  RETURN jsonb_build_object(
    'success',    true,
    'code',       v_code,
    'band_id',    p_band_id,
    'band_name',  p_band_name,
    'province',   p_province,
    'message',    'สร้างรหัสประจำวงสำเร็จ'
  );
END;
$$;

-- 3. redeem → ผู้สมัครจะได้ role = 'pending' แทน 'member'
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

-- 4. lookup_invite_code — อัปเดตให้รองรับ status = 'permanent'
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

-- 5. RPCs สำหรับอนุมัติ/ปฏิเสธสมาชิก
CREATE OR REPLACE FUNCTION public.get_pending_members(p_band_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',         p.id,
      'user_name',  p.user_name,
      'first_name', p.first_name,
      'last_name',  p.last_name,
      'nickname',   p.nickname,
      'instrument', p.instrument,
      'email',      p.email,
      'created_at', p.created_at
    ) ORDER BY p.created_at DESC), '[]'::jsonb)
    FROM public.profiles p
    WHERE p.band_id = p_band_id AND p.role = 'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_member(p_user_id uuid, p_band_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'member'
  WHERE id = p_user_id AND band_id = p_band_id AND role = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'อนุมัติสมาชิกเรียบร้อย');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_member(p_user_id uuid, p_band_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- ลบข้อมูลวงออกจาก profile (ปฏิเสธ)
  UPDATE public.profiles
  SET band_id = NULL, band_name = NULL, role = 'none'
  WHERE id = p_user_id AND band_id = p_band_id AND role = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'ปฏิเสธคำขอเรียบร้อย');
END;
$$;

-- 6. อัปเดตรหัสเก่า active → ให้ยังใช้ได้ (backward compat)
--    ไม่ต้อง migrate — rpcs ใหม่รองรับทั้ง active และ permanent

-- ============================================================
-- DONE
-- ============================================================

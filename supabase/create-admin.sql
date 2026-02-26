-- ============================================================
-- create-admin.sql — สร้างบัญชีแอดมิน krumum.piano@gmail.com
-- วิธีใช้: วาง SQL นี้ใน Supabase → SQL Editor → Run
--
-- สิทธิ์ที่ได้:
--   🔧 Admin     — จัดการผู้ใช้ทุกคน / เข้า Admin Panel
--   👔 Manager   — จัดการวง (บันทึกเงินเดือน, งาน, สมาชิก ฯลฯ)
-- ============================================================

-- ─── 0. extensions ──────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── 1. สร้าง / ตรวจสอบ auth.users ──────────────────────────
DO $$
DECLARE
  v_uid   uuid;
  v_email text := 'krumum.piano@gmail.com';
  v_pass  text := 'Admin@SoulCiety2026';   -- ← เปลี่ยน password ได้ที่นี่
BEGIN

  -- ตรวจว่ามีอยู่แล้วหรือไม่
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_uid IS NULL THEN
    -- ──── สร้างใหม่ ────
    v_uid := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role,
      email, encrypted_password,
      email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      email_change, email_change_token_new
    ) VALUES (
      v_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      v_email,
      crypt(v_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'role',      'admin',
        'user_name', 'Super Admin'
      ),
      now(), now(),
      '', '', '', ''
    );

    RAISE NOTICE 'สร้างบัญชีใหม่: % (uid: %)', v_email, v_uid;
  ELSE
    -- ──── รีเซ็ต password + อัปเดต meta ────
    UPDATE auth.users
    SET
      encrypted_password  = crypt(v_pass, gen_salt('bf')),
      email_confirmed_at  = now(),
      raw_user_meta_data  = jsonb_build_object(
        'role',      'admin',
        'user_name', 'Super Admin'
      ),
      updated_at = now()
    WHERE id = v_uid;

    RAISE NOTICE 'พบบัญชีเดิม — รีเซ็ต password แล้ว (uid: %)', v_uid;
  END IF;

  -- ─── 2. สร้าง / อัปเดต profiles ──────────────────────────
  INSERT INTO public.profiles (id, email, user_name, band_id, band_name, role, status)
  VALUES (
    v_uid,
    v_email,
    'Super Admin',
    '',        -- ← ไม่ผูกกับวงใดวงหนึ่ง (Admin เห็นทุกวงผ่าน RLS ใหม่)
    '',
    'admin',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
    SET role      = 'admin',
        user_name = 'Super Admin',
        status    = 'active';

  RAISE NOTICE '✅ profile พร้อมแล้ว — role = admin';

END;
$$;

-- ─── 3. ผลลัพธ์ — ตรวจสอบ ──────────────────────────────────
SELECT
  p.id,
  p.email,
  p.user_name,
  p.role,
  p.status,
  u.email_confirmed_at IS NOT NULL AS confirmed
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'krumum.piano@gmail.com';

-- ─── บันทึกสำคัญ ──────────────────────────────────────────
-- อีเมล  : krumum.piano@gmail.com
-- รหัสผ่าน: Admin@SoulCiety2026   (เปลี่ยนได้ที่ Authentication → Users)
-- role   : admin  →  มีสิทธิ์ Admin + ผู้จัดการวง
-- ============================================================

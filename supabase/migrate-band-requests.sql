-- ======================================================
-- Migration: band_requests table + RPC functions
-- สำหรับระบบขอสร้างวงใหม่ → เปิดให้ admin อนุมัติ
-- ======================================================

-- 1) สร้างตาราง band_requests
CREATE TABLE IF NOT EXISTS band_requests (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  band_name     text NOT NULL,
  province      text NOT NULL DEFAULT '',
  member_count  int  NOT NULL DEFAULT 1,
  requester_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name  text NOT NULL DEFAULT '',
  requester_email text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  admin_notes   text DEFAULT '',
  band_id       uuid REFERENCES bands(id),            -- set when approved
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE band_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (ผู้สมัครใหม่สร้างได้)
CREATE POLICY "band_requests_insert" ON band_requests
  FOR INSERT WITH CHECK (true);

-- Admin can see all
CREATE POLICY "band_requests_admin_select" ON band_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Requester can see own
CREATE POLICY "band_requests_self_select" ON band_requests
  FOR SELECT USING (requester_id = auth.uid());

-- Admin can update (approve/reject)
CREATE POLICY "band_requests_admin_update" ON band_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2) RPC: submit_band_request
--    ใช้ตอนสมัครสมาชิกแบบ "สร้างวงใหม่"
CREATE OR REPLACE FUNCTION submit_band_request(
  p_user_id       uuid,
  p_band_name     text,
  p_province      text,
  p_member_count  int,
  p_name          text,
  p_email         text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req_id uuid;
BEGIN
  INSERT INTO band_requests (band_name, province, member_count, requester_id, requester_name, requester_email)
  VALUES (p_band_name, p_province, p_member_count, p_user_id, p_name, p_email)
  RETURNING id INTO v_req_id;

  -- อัปเดต profile: status = pending_band (รอ admin อนุมัติ)
  UPDATE profiles SET
    status = 'pending_band',
    role   = 'manager',
    band_name = p_band_name
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req_id,
    'message', 'ส่งคำขอสร้างวงเรียบร้อย! กรุณารอแอดมินอนุมัติ'
  );
END;
$$;

-- 3) RPC: approve_band_request
--    admin อนุมัติ → สร้างวง + สร้าง band_code + อัปเดต profile ผู้ขอ
CREATE OR REPLACE FUNCTION approve_band_request(
  p_request_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req   band_requests%ROWTYPE;
  v_band  bands%ROWTYPE;
  v_code  text;
BEGIN
  SELECT * INTO v_req FROM band_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคำขอ');
  END IF;
  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการแล้ว');
  END IF;

  -- สร้างวง
  INSERT INTO bands (band_name, province, manager_id, manager_email, status)
  VALUES (v_req.band_name, v_req.province, v_req.requester_id, v_req.requester_email, 'active')
  RETURNING * INTO v_band;

  -- สร้าง band code
  v_code := upper(substr(md5(random()::text), 1, 6));
  INSERT INTO invite_codes (band_id, band_name, province, code, status, created_by)
  VALUES (v_band.id, v_band.band_name, v_band.province, v_code, 'permanent', v_req.requester_id);

  -- อัปเดต profile ของผู้ขอ
  UPDATE profiles SET
    band_id   = v_band.id,
    band_name = v_band.band_name,
    province  = v_band.province,
    role      = 'manager',
    status    = 'active'
  WHERE id = v_req.requester_id;

  -- อัปเดต band_requests
  UPDATE band_requests SET
    status     = 'approved',
    band_id    = v_band.id,
    updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'band_id', v_band.id,
    'band_code', v_code,
    'message', 'อนุมัติวง "' || v_band.band_name || '" เรียบร้อย'
  );
END;
$$;

-- 4) RPC: reject_band_request
CREATE OR REPLACE FUNCTION reject_band_request(
  p_request_id uuid,
  p_notes      text DEFAULT ''
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req band_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM band_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'ไม่พบคำขอ');
  END IF;
  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการแล้ว');
  END IF;

  UPDATE band_requests SET
    status      = 'rejected',
    admin_notes = p_notes,
    updated_at  = now()
  WHERE id = p_request_id;

  -- อัปเดต profile status → rejected_band
  UPDATE profiles SET status = 'rejected_band' WHERE id = v_req.requester_id;

  RETURN jsonb_build_object('success', true, 'message', 'ปฏิเสธคำขอเรียบร้อย');
END;
$$;

-- 5) RPC: get_pending_band_requests (admin only)
CREATE OR REPLACE FUNCTION get_pending_band_requests()
RETURNS SETOF band_requests LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM band_requests
    WHERE status = 'pending'
    ORDER BY created_at ASC;
END;
$$;

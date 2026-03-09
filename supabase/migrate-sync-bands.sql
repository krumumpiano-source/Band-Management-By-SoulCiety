-- ============================================================
-- migrate-sync-bands.sql
-- Backfill ตาราง bands จาก profiles ที่มี band_name อยู่แล้ว
-- แล้วอัปเดต profiles.band_id ให้ชี้ไปที่ bands.id ตัวจริง
-- ============================================================

-- ── 1. สร้าง bands จาก profiles ที่ยังไม่มี ─────────────────
DO $$
DECLARE
  r RECORD;
  v_band_id uuid;
  v_code text;
BEGIN
  -- วนทุก band_name ที่มีใน profiles แต่ยังไม่มีใน bands
  FOR r IN
    SELECT DISTINCT ON (p.band_name)
      p.band_name,
      p.province,
      p.id AS first_user_id,
      p.email AS first_user_email,
      p.created_at
    FROM profiles p
    WHERE p.band_name IS NOT NULL
      AND p.band_name != ''
      AND NOT EXISTS (
        SELECT 1 FROM bands b WHERE b.band_name = p.band_name
      )
    ORDER BY p.band_name, p.role ASC, p.created_at ASC
    -- role ASC ให้ 'admin'/'manager' มาก่อน 'member'
  LOOP
    -- สร้างวงใหม่
    INSERT INTO bands (band_name, province, manager_id, manager_email, status, created_at)
    VALUES (r.band_name, r.province, r.first_user_id, r.first_user_email, 'active', r.created_at)
    RETURNING id INTO v_band_id;

    -- สร้าง invite code ถ้ายังไม่มี
    IF NOT EXISTS (
      SELECT 1 FROM invite_codes WHERE band_name = r.band_name AND status = 'permanent'
    ) THEN
      v_code := upper(substr(md5(random()::text), 1, 6));
      INSERT INTO invite_codes (band_id, band_name, province, code, status, created_by)
      VALUES (v_band_id, r.band_name, r.province, v_code, 'permanent', r.first_user_id);
    END IF;

    -- อัปเดต profiles ทุกคนในวงนี้ให้ band_id ชี้ไปที่ bands.id ตัวจริง
    UPDATE profiles
    SET band_id = v_band_id::text
    WHERE band_name = r.band_name
      AND (band_id IS NULL OR band_id = '' OR band_id != v_band_id::text);

    RAISE NOTICE 'Synced band: % -> %', r.band_name, v_band_id;
  END LOOP;
END $$;

-- ── 2. แก้ profiles ที่มี band_name แต่ band_id ชี้ผิด ──────
UPDATE profiles p
SET band_id = b.id::text
FROM bands b
WHERE p.band_name = b.band_name
  AND p.band_name IS NOT NULL
  AND p.band_name != ''
  AND (p.band_id IS NULL OR p.band_id = '' OR p.band_id != b.id::text);

-- ── 3. อัปเดต invite_codes ที่ band_id ว่าง ────────────────
UPDATE invite_codes ic
SET band_id = b.id::text
FROM bands b
WHERE ic.band_name = b.band_name
  AND ic.band_name IS NOT NULL
  AND (ic.band_id IS NULL OR ic.band_id = '');

-- ── 4. อัปเดต band_requests ที่ approved แต่ band_id ว่าง ───
UPDATE band_requests br
SET band_id = b.id
FROM bands b
WHERE br.band_name = b.band_name
  AND br.status = 'approved'
  AND br.band_id IS NULL;

-- ── ตรวจสอบผล ──────────────────────────────────────────────
-- SELECT * FROM bands ORDER BY created_at;
-- SELECT band_name, band_id, count(*) FROM profiles WHERE band_name IS NOT NULL GROUP BY band_name, band_id;

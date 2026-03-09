-- ============================================================
-- BandThai: Artists Master Table + Normalization
-- ป้องกันชื่อศิลปินซ้ำ (เว้นวรรค, ตัวพิมพ์, สลับไทย/อังกฤษ)
-- ============================================================

-- 0) Ensure is_admin() helper exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT coalesce((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin', false)
$$;

-- 0.1) Clean up partial state from any previous failed attempt
DROP TABLE IF EXISTS artists CASCADE;

-- 1) สร้างตาราง artists (ระดับระบบ ไม่ผูก band)
CREATE TABLE artists (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,                           -- ชื่อจริง (แสดงผล)
    name_normalized TEXT NOT NULL,                       -- ชื่อ normalize (ใช้ตรวจซ้ำ)
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT artists_name_normalized_unique UNIQUE (name_normalized)
);

-- 2) ฟังก์ชัน normalize ชื่อศิลปิน
--    - ลบเว้นวรรค, ขีด, จุด ทั้งหมด
--    - lowercase อักษรอังกฤษ
--    - ผลลัพธ์: "Body Slam" -> "bodyslam", "บอดี้สแลม" -> "บอดี้สแลม"
CREATE OR REPLACE FUNCTION normalize_artist_name(raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN lower(regexp_replace(COALESCE(raw, ''), '[\s\-\.\_\,]+', '', 'g'));
END;
$$;

-- 3) Trigger: ทุกครั้งที่ INSERT/UPDATE จะ normalize อัตโนมัติ
CREATE OR REPLACE FUNCTION trg_normalize_artist()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.name_normalized := normalize_artist_name(NEW.name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_artists_normalize ON artists;
CREATE TRIGGER trg_artists_normalize
    BEFORE INSERT OR UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION trg_normalize_artist();

-- 4) RLS: อ่านได้ทุกคนที่ login, เพิ่ม/แก้/ลบเฉพาะ admin
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artists_select" ON artists;
CREATE POLICY "artists_select" ON artists
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "artists_admin_insert" ON artists;
CREATE POLICY "artists_admin_insert" ON artists
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "artists_admin_update" ON artists;
CREATE POLICY "artists_admin_update" ON artists
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "artists_admin_delete" ON artists;
CREATE POLICY "artists_admin_delete" ON artists
    FOR DELETE USING (public.is_admin());

-- 5) RPC: เพิ่มศิลปินพร้อม check ซ้ำ (คืน existing ถ้าซ้ำ)
CREATE OR REPLACE FUNCTION add_artist(p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_norm TEXT;
    v_existing RECORD;
    v_new RECORD;
BEGIN
    -- ตรวจสิทธิ์ admin
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'ต้องเป็น admin เท่านั้น');
    END IF;

    v_norm := normalize_artist_name(p_name);

    IF v_norm = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'ชื่อศิลปินว่าง');
    END IF;

    -- เช็คซ้ำ
    SELECT * INTO v_existing FROM artists WHERE name_normalized = v_norm LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'duplicate', true,
            'message', 'ศิลปินซ้ำกับ "' || v_existing.name || '"',
            'existing', jsonb_build_object('id', v_existing.id, 'name', v_existing.name)
        );
    END IF;

    -- เพิ่มใหม่
    INSERT INTO artists (name, name_normalized)
    VALUES (TRIM(p_name), v_norm)
    RETURNING * INTO v_new;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object('id', v_new.id, 'name', v_new.name)
    );
END;
$$;

-- 6) RPC: ค้นหาศิลปินที่คล้ายกัน (fuzzy search สำหรับ autocomplete)
CREATE OR REPLACE FUNCTION search_artists(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_norm TEXT;
    v_results JSONB;
BEGIN
    v_norm := normalize_artist_name(p_query);

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('id', a.id, 'name', a.name)
        ORDER BY a.name
    ), '[]'::jsonb)
    INTO v_results
    FROM artists a
    WHERE a.name_normalized LIKE '%' || v_norm || '%'
       OR a.name ILIKE '%' || TRIM(p_query) || '%'
    LIMIT p_limit;

    RETURN jsonb_build_object('success', true, 'data', v_results);
END;
$$;

-- 7) ล้างข้อมูล artist ในเพลงทั้งหมด
UPDATE band_songs SET artist = '' WHERE artist IS NOT NULL AND artist != '';

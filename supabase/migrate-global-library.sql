-- ============================================================
-- migrate-global-library.sql
-- Global Library Architecture + Era/Genre Migration
-- 
-- What this does:
--   1. Migrate old era values → new decade codes (80s, 90s, etc.)
--   2. Add 'source' column if missing (global | band)
--   3. Update RLS policies: global songs = admin only for write,
--      band songs = own-band only for write, all can read.
-- 
-- Run order: run ONCE in Supabase SQL editor.
-- ============================================================

-- ── Step 1: Ensure source column exists ─────────────────────
ALTER TABLE band_songs
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'global';

-- Mark existing songs without band_id as global
UPDATE band_songs
  SET source = 'global'
  WHERE band_id IS NULL AND (source IS NULL OR source = '');

-- Mark existing songs with band_id as band
UPDATE band_songs
  SET source = 'band'
  WHERE band_id IS NOT NULL AND (source IS NULL OR source = '');

-- ── Step 2: Migrate old era values to decade codes ──────────
-- Old value  → New value
-- 2523-2532  → 80s   (C.E. 1980-1989)
-- 2533-2542  → 90s   (C.E. 1990-1999)
-- 2543-2553  → 2000s (C.E. 2000-2009)
-- 2554-ปัจจุบัน → split: 2010s or 2020s  (edge: map to 2010s)
-- 2554-2562  → 2010s (C.E. 2011-2019)
-- สากล / ลูกทุ่ง/อีสาน/เพื่อชีวิต → cleared (use genre/tags instead)

UPDATE band_songs SET era = '80s'   WHERE era = '2523-2532';
UPDATE band_songs SET era = '90s'   WHERE era = '2533-2542';
UPDATE band_songs SET era = '2000s' WHERE era = '2543-2553';
UPDATE band_songs SET era = '2010s' WHERE era LIKE '2554%';
UPDATE band_songs SET era = NULL    WHERE era IN ('สากล', 'ลูกทุ่ง/อีสาน/เพื่อชีวิต');

-- ── Step 3: Rewrite RLS policies on band_songs ──────────────

-- Drop all existing policies on band_songs
DROP POLICY IF EXISTS "songs_select"    ON band_songs;
DROP POLICY IF EXISTS "songs_insert"    ON band_songs;
DROP POLICY IF EXISTS "songs_update"    ON band_songs;
DROP POLICY IF EXISTS "songs_delete"    ON band_songs;
-- Also drop any older policy names that may exist
DROP POLICY IF EXISTS "band_songs_select" ON band_songs;
DROP POLICY IF EXISTS "band_songs_insert" ON band_songs;
DROP POLICY IF EXISTS "band_songs_update" ON band_songs;
DROP POLICY IF EXISTS "band_songs_delete" ON band_songs;
DROP POLICY IF EXISTS "Allow select band songs" ON band_songs;
DROP POLICY IF EXISTS "Allow insert band songs" ON band_songs;
DROP POLICY IF EXISTS "Allow update band songs" ON band_songs;
DROP POLICY IF EXISTS "Allow delete band songs" ON band_songs;

-- Enable RLS (idempotent)
ALTER TABLE band_songs ENABLE ROW LEVEL SECURITY;

-- SELECT: everyone authenticated can read all songs (global + their band)
CREATE POLICY "songs_read_all"
  ON band_songs FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      (source = 'global' AND band_id IS NULL)
      OR (band_id = get_my_band_id())
      OR is_admin()
    )
  );

-- INSERT global songs: admin only
CREATE POLICY "songs_insert_global"
  ON band_songs FOR INSERT
  WITH CHECK (
    is_admin() AND band_id IS NULL
  );

-- INSERT band songs: members of that band (or admin)
CREATE POLICY "songs_insert_band"
  ON band_songs FOR INSERT
  WITH CHECK (
    band_id IS NOT NULL AND (band_id = get_my_band_id() OR is_admin())
  );

-- UPDATE: admin can update any, member can update own-band songs only
CREATE POLICY "songs_update"
  ON band_songs FOR UPDATE
  USING (
    is_admin() OR band_id = get_my_band_id()
  )
  WITH CHECK (
    is_admin() OR band_id = get_my_band_id()
  );

-- DELETE: admin can delete any, member can delete own-band songs only
CREATE POLICY "songs_delete"
  ON band_songs FOR DELETE
  USING (
    is_admin() OR band_id = get_my_band_id()
  );

-- ── Step 4: Helper RPC for cloning songs to band library ────
-- Called by the frontend cloneSongsToBand API

CREATE OR REPLACE FUNCTION clone_songs_to_band(song_ids UUID[], p_band_id UUID)
RETURNS TABLE(id UUID, name TEXT, success BOOLEAN, note TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_song RECORD;
  v_exists BOOLEAN;
  v_new_id UUID;
BEGIN
  FOREACH v_new_id IN ARRAY song_ids LOOP
    SELECT * INTO v_song FROM band_songs WHERE band_songs.id = v_new_id;
    
    IF NOT FOUND THEN
      RETURN QUERY SELECT v_new_id, ''::TEXT, FALSE, 'not_found';
      CONTINUE;
    END IF;
    
    -- Check if song with same name already exists in band library
    SELECT EXISTS(
      SELECT 1 FROM band_songs bs
      WHERE bs.band_id = p_band_id
        AND LOWER(TRIM(bs.name)) = LOWER(TRIM(v_song.name))
    ) INTO v_exists;
    
    IF v_exists THEN
      RETURN QUERY SELECT v_new_id, v_song.name, FALSE, 'duplicate';
      CONTINUE;
    END IF;
    
    -- Clone into band library
    INSERT INTO band_songs (name, artist, key, bpm, singer, era, mood, tags, notes, band_id, source)
      VALUES (v_song.name, v_song.artist, v_song.key, v_song.bpm, v_song.singer,
              v_song.era, v_song.mood, v_song.tags, v_song.notes, p_band_id, 'band')
      RETURNING band_songs.id INTO v_new_id;
    
    RETURN QUERY SELECT v_new_id, v_song.name, TRUE, 'cloned';
  END LOOP;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION clone_songs_to_band(UUID[], UUID) TO authenticated;

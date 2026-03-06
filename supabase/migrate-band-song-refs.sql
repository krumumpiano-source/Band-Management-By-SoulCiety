-- Band Song References: lightweight junction table instead of cloning full rows
-- Saves ~450 bytes per song per band (ref ~48 bytes vs clone ~500 bytes)

CREATE TABLE IF NOT EXISTS band_song_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  song_id UUID NOT NULL REFERENCES band_songs(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(band_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_bsr_band ON band_song_refs(band_id);

ALTER TABLE band_song_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bsr: read own band"
  ON band_song_refs FOR SELECT
  USING (band_id = get_my_band_id());

CREATE POLICY "bsr: insert own band"
  ON band_song_refs FOR INSERT
  WITH CHECK (band_id = get_my_band_id());

CREATE POLICY "bsr: delete own band"
  ON band_song_refs FOR DELETE
  USING (band_id = get_my_band_id());

-- Migrate existing clones to refs (one-time)
INSERT INTO band_song_refs (band_id, song_id)
SELECT bs.band_id, g.id
FROM band_songs bs
JOIN band_songs g ON g.band_id IS NULL
  AND lower(trim(g.name)) = lower(trim(bs.name))
  AND lower(trim(g.artist)) = lower(trim(bs.artist))
WHERE bs.band_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Remove migrated clones (keep band-owned songs that have no global match)
DELETE FROM band_songs bs
WHERE bs.band_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM band_song_refs bsr
    WHERE bsr.band_id = bs.band_id
      AND bsr.song_id IN (
        SELECT g.id FROM band_songs g
        WHERE g.band_id IS NULL
          AND lower(trim(g.name)) = lower(trim(bs.name))
          AND lower(trim(g.artist)) = lower(trim(bs.artist))
      )
  );

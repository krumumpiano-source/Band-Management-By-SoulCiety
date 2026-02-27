-- Add notes column to band_members
ALTER TABLE public.band_members ADD COLUMN IF NOT EXISTS notes text;

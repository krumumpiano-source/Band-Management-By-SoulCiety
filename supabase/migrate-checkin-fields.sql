-- Add venue and slots columns to member_check_ins
ALTER TABLE public.member_check_ins
  ADD COLUMN IF NOT EXISTS venue text DEFAULT '',
  ADD COLUMN IF NOT EXISTS slots jsonb DEFAULT '[]'::jsonb;

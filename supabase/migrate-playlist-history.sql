-- migrate-playlist-history.sql
-- เพิ่มคอลัมน์ date, venue, time_slot, created_by ให้ playlist_history
-- เพื่อให้ค้นหาตามวันที่ได้ และรู้ว่าใครเป็นคนทำลิส

ALTER TABLE public.playlist_history
  ADD COLUMN IF NOT EXISTS date       text,
  ADD COLUMN IF NOT EXISTS venue      text,
  ADD COLUMN IF NOT EXISTS time_slot  text,
  ADD COLUMN IF NOT EXISTS created_by text;

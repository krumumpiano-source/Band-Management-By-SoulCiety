-- ============================================================
-- migrate-leave-columns.sql
-- Add missing columns to leave_requests: venue, slots, substitute_contact
-- Run once in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS venue              text,
  ADD COLUMN IF NOT EXISTS slots              text,           -- JSON array string e.g. '["19:30-20:30","21:00-22:00"]'
  ADD COLUMN IF NOT EXISTS substitute_contact text;

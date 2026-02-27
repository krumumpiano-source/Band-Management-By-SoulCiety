-- ============================================================
-- migrate-schedule-checkin-fix.sql
-- แก้ปัญหาคอลัมน์ที่ frontend ใช้แต่ไม่มีใน DB
-- 1. schedule: start_time, end_time, price, address, contact, members, venue
-- 2. invite_codes: created_by
-- 3. member_check_ins: notes, substitute (เพิ่มถ้ายังไม่มี)
-- ============================================================

-- ── 1. schedule — คอลัมน์สำหรับ external gigs (งานนอก) ────────
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS end_time   text;
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS price      numeric DEFAULT 0;
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS address    text DEFAULT '';
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS contact    text DEFAULT '';
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS members    jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.schedule ADD COLUMN IF NOT EXISTS venue      text DEFAULT '';

-- ── 2. invite_codes — ใช้ใน approve_band_request RPC ──────────
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS created_by uuid;

-- ── 3. member_check_ins — notes + substitute (ถ้ายังไม่มี) ────
ALTER TABLE public.member_check_ins ADD COLUMN IF NOT EXISTS notes      text DEFAULT '';
ALTER TABLE public.member_check_ins ADD COLUMN IF NOT EXISTS substitute jsonb;

-- ============================================================
-- DONE
-- ============================================================

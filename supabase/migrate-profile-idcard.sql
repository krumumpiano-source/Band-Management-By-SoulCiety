-- ============================================================
-- Migration: เพิ่มคอลัมน์ข้อมูลบัตรประชาชน + ที่อยู่ใน profiles
-- Run ใน Supabase SQL Editor
-- ============================================================

-- เลขบัตรประชาชน 13 หลัก
alter table public.profiles add column if not exists id_card_number text default '';

-- วันเกิด
alter table public.profiles add column if not exists birth_date date;

-- ที่อยู่ตามบัตรประชาชน (JSON: houseNo, moo, soi, road, subDistrict, district, province, postalCode)
alter table public.profiles add column if not exists id_card_address jsonb default '{}'::jsonb;

-- ที่อยู่ปัจจุบัน (JSON: houseNo, moo, soi, road, subDistrict, district, province, postalCode)
alter table public.profiles add column if not exists current_address jsonb default '{}'::jsonb;

-- updated_at (ถ้ายังไม่มี)
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- ============================================================
-- Migration: เพิ่มคอลัมน์ข้อมูลบัตรประชาชนใน profiles
-- Run ใน Supabase SQL Editor
-- ============================================================

-- เลขบัตรประชาชน 13 หลัก
alter table public.profiles add column if not exists id_card_number text default '';

-- วันเกิด
alter table public.profiles add column if not exists birth_date date;

-- ที่อยู่ตามบัตรประชาชน
alter table public.profiles add column if not exists id_card_address text default '';

-- updated_at (ถ้ายังไม่มี)
alter table public.profiles add column if not exists updated_at timestamptz default now();

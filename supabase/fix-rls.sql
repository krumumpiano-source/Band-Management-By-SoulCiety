-- ============================================================
-- fix-rls.sql — แก้ infinite recursion + เพิ่ม Admin bypass
-- วิธีใช้: วาง SQL นี้ใน Supabase → SQL Editor → Run
-- ============================================================

-- ─── Helper shorthand ──────────────────────────────────────
-- แทนที่จะ copy expression ซ้ำ ใช้ macro ผ่าน function
-- ──────────────────────────────────────────────────────────────

-- 1. Helper functions (security definer = bypass RLS)
create or replace function public.get_my_band_id()
returns text language sql security definer stable set search_path = public as $$
  select band_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── Shorthand: true ถ้าผู้ใช้ปัจจุบันเป็น admin ─────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false)
$$;

-- 2. Profiles policies
-- ──────────────────────────────────────────────────────────────
drop policy if exists "profiles: admin ดูทั้งหมด" on public.profiles;
drop policy if exists "profiles: admin แก้ไขทั้งหมด" on public.profiles;

-- Admin เห็น + แก้ไข profile ทุกคน
create policy "profiles: admin ดูทั้งหมด"
  on public.profiles for select
  using (public.is_admin() OR auth.uid() = id);

create policy "profiles: admin แก้ไขทั้งหมด"
  on public.profiles for update
  using (public.is_admin() OR auth.uid() = id);

-- 3. ทุกตาราง Band data — Admin เห็นทุกวง ─────────────────────
-- ── band_members ─────────────────────────────────────────────
drop policy if exists "band_members: เห็นเฉพาะวงตัวเอง" on public.band_members;
create policy "band_members: เห็นเฉพาะวงตัวเอง"
  on public.band_members for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── venues ───────────────────────────────────────────────────
drop policy if exists "venues: เห็นเฉพาะวงตัวเอง" on public.venues;
create policy "venues: เห็นเฉพาะวงตัวเอง"
  on public.venues for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── schedule ─────────────────────────────────────────────────
drop policy if exists "schedule: เห็นเฉพาะวงตัวเอง" on public.schedule;
create policy "schedule: เห็นเฉพาะวงตัวเอง"
  on public.schedule for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── attendance_payroll ───────────────────────────────────────
drop policy if exists "attendance: เห็นเฉพาะวงตัวเอง" on public.attendance_payroll;
create policy "attendance: เห็นเฉพาะวงตัวเอง"
  on public.attendance_payroll for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── band_songs ───────────────────────────────────────────────
drop policy if exists "songs: แก้ไข/ลบเฉพาะวงตัวเอง" on public.band_songs;
create policy "songs: แก้ไข/ลบเฉพาะวงตัวเอง"
  on public.band_songs for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── hourly_rates ─────────────────────────────────────────────
drop policy if exists "hourly_rates: เห็นเฉพาะวงตัวเอง" on public.hourly_rates;
create policy "hourly_rates: เห็นเฉพาะวงตัวเอง"
  on public.hourly_rates for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── equipment ────────────────────────────────────────────────
drop policy if exists "equipment: เห็นเฉพาะวงตัวเอง" on public.equipment;
create policy "equipment: เห็นเฉพาะวงตัวเอง"
  on public.equipment for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── clients ──────────────────────────────────────────────────
drop policy if exists "clients: เห็นเฉพาะวงตัวเอง" on public.clients;
create policy "clients: เห็นเฉพาะวงตัวเอง"
  on public.clients for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── quotations ───────────────────────────────────────────────
drop policy if exists "quotations: เห็นเฉพาะวงตัวเอง" on public.quotations;
create policy "quotations: เห็นเฉพาะวงตัวเอง"
  on public.quotations for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── invite_codes ─────────────────────────────────────────────
drop policy if exists "invite_codes: สร้าง/แก้ไขเฉพาะ manager" on public.invite_codes;
create policy "invite_codes: สร้าง/แก้ไขเฉพาะ manager"
  on public.invite_codes for all
  using (
    public.is_admin()
    OR (band_id = public.get_my_band_id() AND public.get_my_role() IN ('manager','admin'))
  );

-- ── leave_requests ───────────────────────────────────────────
drop policy if exists "leave_requests: เห็นเฉพาะวงตัวเอง" on public.leave_requests;
create policy "leave_requests: เห็นเฉพาะวงตัวเอง"
  on public.leave_requests for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── member_check_ins ─────────────────────────────────────────
drop policy if exists "check_ins: เห็นเฉพาะวงตัวเอง" on public.member_check_ins;
create policy "check_ins: เห็นเฉพาะวงตัวเอง"
  on public.member_check_ins for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── band_settings ────────────────────────────────────────────
drop policy if exists "band_settings: เห็นเฉพาะวงตัวเอง" on public.band_settings;
create policy "band_settings: เห็นเฉพาะวงตัวเอง"
  on public.band_settings for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── playlist_history ─────────────────────────────────────────
drop policy if exists "playlist_history: เห็นเฉพาะวงตัวเอง" on public.playlist_history;
create policy "playlist_history: เห็นเฉพาะวงตัวเอง"
  on public.playlist_history for all
  using (public.is_admin() OR band_id = public.get_my_band_id());

-- ── bands ────────────────────────────────────────────────────
drop policy if exists "bands: admin จัดการทั้งหมด" on public.bands;
create policy "bands: admin จัดการทั้งหมด"
  on public.bands for all
  using (public.is_admin());

-- ============================================================
-- ตรวจสอบผล
-- ============================================================
-- select count(*) from public.band_songs;
-- select * from public.profiles where role = 'admin';

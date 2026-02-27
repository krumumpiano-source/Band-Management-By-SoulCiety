-- ============================================================
-- Band Management By SoulCiety — Supabase Schema
-- วิธีใช้: วาง SQL นี้ใน Supabase → SQL Editor → Run
-- ============================================================

-- ── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (ต่อจาก auth.users ของ Supabase)
--    เก็บ bandId, bandName, role, status
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  user_name   text,
  band_id     text,
  band_name   text,
  role        text default 'manager',   -- manager | member | admin
  status      text default 'active',    -- active | inactive
  title       text default '',
  first_name  text default '',
  last_name   text default '',
  nickname    text default '',
  instrument  text default '',
  phone       text default '',
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;

-- ── Helper functions (security definer = bypass RLS เพื่อป้องกัน infinite recursion) ──
create or replace function public.get_my_band_id()
returns text language sql security definer stable set search_path = public as $$
  select band_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles: ดูของตัวเอง"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: แก้ไขของตัวเอง"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: admin ดูทั้งหมด"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

create policy admin_update_all
  on public.profiles for update
  using (public.get_my_role() = 'admin');

create policy admin_delete_all
  on public.profiles for delete
  using (public.get_my_role() = 'admin');

-- trigger: สร้าง profile อัตโนมัติหลัง sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, user_name, band_id, band_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'band_id', ''),
    coalesce(new.raw_user_meta_data->>'band_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'manager'),
    'active'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. BANDS
-- ============================================================
create table if not exists public.bands (
  id            uuid primary key default uuid_generate_v4(),
  band_name     text not null,
  manager_id    uuid,
  manager_email text,
  description   text,
  status        text default 'active',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.bands enable row level security;

create policy "bands: ดูได้ถ้า login"
  on public.bands for select using (auth.uid() is not null);

create policy "bands: แก้ไขได้เฉพาะ manager"
  on public.bands for update
  using (manager_id = auth.uid());

create policy "bands: สร้างได้ถ้า login"
  on public.bands for insert with check (auth.uid() is not null);

-- ============================================================
-- 3. BAND_MEMBERS
-- ============================================================
create table if not exists public.band_members (
  id                  uuid primary key default uuid_generate_v4(),
  band_id             text not null,
  name                text not null,
  position            text,
  phone               text,
  email               text,
  default_hourly_rate numeric default 0,
  status              text default 'active',
  joined_at           text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.band_members enable row level security;

create policy "band_members: เห็นเฉพาะวงตัวเอง"
  on public.band_members for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 4. VENUES
-- ============================================================
create table if not exists public.venues (
  id              uuid primary key default uuid_generate_v4(),
  band_id         text not null,
  venue_name      text not null,
  address         text,
  phone           text,
  contact_person  text,
  default_pay     numeric default 0,
  notes           text,
  status          text default 'active',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.venues enable row level security;

create policy "venues: เห็นเฉพาะวงตัวเอง"
  on public.venues for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 5. SCHEDULE
-- ============================================================
create table if not exists public.schedule (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null,
  type        text default 'external',   -- regular | external
  venue_name  text,
  venue_id    text,
  date        text,
  day_of_week integer,
  time_slots  jsonb default '[]',
  description text,
  status      text default 'confirmed',
  total_pay   numeric default 0,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.schedule enable row level security;

create policy "schedule: เห็นเฉพาะวงตัวเอง"
  on public.schedule for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 6. ATTENDANCE_PAYROLL
-- ============================================================
create table if not exists public.attendance_payroll (
  id                uuid primary key default uuid_generate_v4(),
  band_id           text not null,
  date              text not null,
  venue             text,
  time_slots        jsonb default '[]',
  attendance        jsonb default '{}',
  substitutes       jsonb default '[]',
  price_adjustments jsonb default '[]',
  total_amount      numeric default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
alter table public.attendance_payroll enable row level security;

create policy "attendance: เห็นเฉพาะวงตัวเอง"
  on public.attendance_payroll for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 7. BAND_SONGS
-- ============================================================
create table if not exists public.band_songs (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text,
  name        text not null,
  artist      text,
  key         text,
  bpm         text,
  singer      text,
  mood        text,
  era         text,
  tags        text,
  notes       text,
  source      text default 'global',   -- global | band
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.band_songs enable row level security;

create policy "songs: ดูได้ถ้า login"
  on public.band_songs for select using (auth.uid() is not null);

create policy "songs: แก้ไข/ลบเฉพาะวงตัวเอง"
  on public.band_songs for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 8. HOURLY_RATES
-- ============================================================
create table if not exists public.hourly_rates (
  id              uuid primary key default uuid_generate_v4(),
  band_id         text not null,
  member_id       text,
  venue_id        text,
  start_time      text,
  end_time        text,
  hourly_rate     numeric default 0,
  effective_from  text,
  effective_to    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.hourly_rates enable row level security;

create policy "hourly_rates: เห็นเฉพาะวงตัวเอง"
  on public.hourly_rates for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 9. EQUIPMENT
-- ============================================================
create table if not exists public.equipment (
  id              uuid primary key default uuid_generate_v4(),
  band_id         text not null,
  name            text not null,
  type            text,
  owner           text,
  serial_no       text,
  purchase_date   text,
  price           numeric default 0,
  status          text default 'active',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.equipment enable row level security;

create policy "equipment: เห็นเฉพาะวงตัวเอง"
  on public.equipment for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 10. CLIENTS
-- ============================================================
create table if not exists public.clients (
  id              uuid primary key default uuid_generate_v4(),
  band_id         text not null,
  name            text not null,
  company         text,
  contact_person  text,
  phone           text,
  email           text,
  line_id         text,
  address         text,
  notes           text,
  total_gigs      integer default 0,
  total_revenue   numeric default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.clients enable row level security;

create policy "clients: เห็นเฉพาะวงตัวเอง"
  on public.clients for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 11. QUOTATIONS
-- ============================================================
create table if not exists public.quotations (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null,
  client_id   text,
  client_name text,
  date        text,
  event_date  text,
  event_type  text,
  venue       text,
  items       jsonb default '[]',
  subtotal    numeric default 0,
  vat         numeric default 0,
  vat_amount  numeric default 0,
  total       numeric default 0,
  status      text default 'draft',
  notes       text,
  doc_url     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.quotations enable row level security;

create policy "quotations: เห็นเฉพาะวงตัวเอง"
  on public.quotations for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 12. INVITE_CODES
-- ============================================================
create table if not exists public.invite_codes (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,
  band_id     text not null,
  band_name   text,
  expires_at  timestamptz,
  status      text default 'active',
  used_by     text,
  created_at  timestamptz default now()
);
alter table public.invite_codes enable row level security;

create policy "invite_codes: ดูได้ถ้า login"
  on public.invite_codes for select using (auth.uid() is not null);

create policy "invite_codes: สร้าง/แก้ไขเฉพาะ manager"
  on public.invite_codes for all
  using (
    band_id = public.get_my_band_id()
    and public.get_my_role() in ('manager','admin')
  );

-- ============================================================
-- 13. LEAVE_REQUESTS
-- ============================================================
create table if not exists public.leave_requests (
  id                  uuid primary key default uuid_generate_v4(),
  band_id             text not null,
  member_id           text not null,
  member_name         text,
  date                text not null,
  venue               text,
  slots               text,           -- JSON array e.g. '["19:30-20:30"]'
  reason              text,
  status              text default 'pending',   -- pending | approved | rejected
  substitute_id       text,
  substitute_name     text,
  substitute_contact  text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.leave_requests enable row level security;

create policy "leave_requests: เห็นเฉพาะวงตัวเอง"
  on public.leave_requests for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 14. MEMBER_CHECK_INS
-- ============================================================
create table if not exists public.member_check_ins (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null,
  member_id   text not null,
  member_name text,
  date        text not null,
  venue       text default '',
  slots       jsonb default '[]'::jsonb,
  check_in_at timestamptz,
  status      text default 'present',
  created_at  timestamptz default now()
);
alter table public.member_check_ins enable row level security;

create policy "check_ins: เห็นเฉพาะวงตัวเอง"
  on public.member_check_ins for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 15. BAND_SETTINGS
-- ============================================================
create table if not exists public.band_settings (
  id        uuid primary key default uuid_generate_v4(),
  band_id   text not null unique,
  settings  jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.band_settings enable row level security;

create policy "band_settings: เห็นเฉพาะวงตัวเอง"
  on public.band_settings for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 16. PLAYLIST_HISTORY
-- ============================================================
create table if not exists public.playlist_history (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null,
  band_name   text,
  playlist    jsonb default '[]',
  created_at  timestamptz default now()
);
alter table public.playlist_history enable row level security;

create policy "playlist_history: เห็นเฉพาะวงตัวเอง"
  on public.playlist_history for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 17. SETLISTS
-- ============================================================
create table if not exists public.setlists (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null unique,
  sets_data   jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.setlists enable row level security;
create policy "setlists: เห็นเฉพาะวงตัวเอง"
  on public.setlists for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 18. FUND_TRANSACTIONS
-- ============================================================
create table if not exists public.fund_transactions (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null,
  type        text not null default 'income',
  amount      numeric default 0,
  date        text not null,
  category    text default '',
  description text default '',
  created_at  timestamptz default now()
);
alter table public.fund_transactions enable row level security;
create policy "fund_tx: เห็นเฉพาะวงตัวเอง"
  on public.fund_transactions for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- 19. EXTERNAL_PAYOUTS
-- ============================================================
create table if not exists public.external_payouts (
  id          uuid primary key default uuid_generate_v4(),
  band_id     text not null,
  payee_name  text default '',
  payee_type  text default '',
  amount      numeric default 0,
  date        text default '',
  job_id      text default '',
  notes       text default '',
  created_at  timestamptz default now()
);
alter table public.external_payouts enable row level security;
create policy "ext_payouts: เห็นเฉพาะวงตัวเอง"
  on public.external_payouts for all
  using (band_id = public.get_my_band_id());

-- ============================================================
-- FUNCTIONS — custom RPC สำหรับ invite code
-- ============================================================

-- redeem_invite_code(code, user_id)
create or replace function public.redeem_invite_code(p_code text, p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_invite public.invite_codes%rowtype;
  v_used   text;
begin
  -- ค้นหา code
  select * into v_invite
  from public.invite_codes
  where upper(code) = upper(p_code) and status = 'active'
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสเชิญหรือหมดอายุแล้ว');
  end if;

  if v_invite.expires_at < now() then
    update public.invite_codes set status = 'expired' where id = v_invite.id;
    return jsonb_build_object('success', false, 'message', 'รหัสเชิญหมดอายุแล้ว');
  end if;

  -- อัปเดต profile ของ user
  update public.profiles
  set band_id   = v_invite.band_id,
      band_name = v_invite.band_name,
      role      = 'member'
  where id = p_user_id;

  -- บันทึกการใช้ code
  v_used := coalesce(v_invite.used_by, '') || case when v_invite.used_by is not null then ',' else '' end || p_user_id::text;
  update public.invite_codes set used_by = v_used where id = v_invite.id;

  return jsonb_build_object(
    'success',   true,
    'band_id',   v_invite.band_id,
    'band_name', v_invite.band_name,
    'message',   'เข้าร่วมวงสำเร็จ!'
  );
end;
$$;

-- generate_invite_code(band_id, band_name)
create or replace function public.generate_invite_code(p_band_id text, p_band_name text)
returns jsonb language plpgsql security definer as $$
declare
  v_code    text := '';
  v_chars   text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_expires timestamptz := now() + interval '7 days';
  i         integer;
begin
  -- สร้าง random code 6 ตัว
  for i in 1..6 loop
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
  end loop;

  insert into public.invite_codes (code, band_id, band_name, expires_at, status)
  values (v_code, p_band_id, p_band_name, v_expires, 'active');

  return jsonb_build_object(
    'success',    true,
    'code',       v_code,
    'band_id',    p_band_id,
    'band_name',  p_band_name,
    'expires_at', v_expires
  );
end;
$$;

-- ============================================================
-- DONE — schema พร้อมใช้งาน
-- ============================================================

-- ══════════════════════════════════════════════════════
-- SONG SUGGESTIONS (แนะนำการแก้ไขเพลง)
-- สมาชิกแนะนำ → แอดมินตรวจสอบ ยืนยัน/ปฏิเสธ
-- ══════════════════════════════════════════════════════

create table if not exists public.song_suggestions (
  id            uuid primary key default uuid_generate_v4(),
  song_id       uuid not null,
  suggested_by  uuid,
  suggested_name text,
  suggested_data jsonb not null default '{}'::jsonb,
  note          text,
  status        text not null default 'pending',
  admin_note    text,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz default now()
);

alter table public.song_suggestions enable row level security;

-- ทุกคนที่ล็อกอินอ่านได้
create policy "song_suggestions: authenticated read"
  on public.song_suggestions for select
  using (auth.uid() is not null);

-- ทุกคนที่ล็อกอินสร้างได้
create policy "song_suggestions: authenticated insert"
  on public.song_suggestions for insert
  with check (auth.uid() is not null);

-- แอดมินแก้ได้ (approve/reject) - ใช้ service role หรือ management API
create policy "song_suggestions: authenticated update"
  on public.song_suggestions for update
  using (auth.uid() is not null);

create index if not exists idx_song_suggestions_status on public.song_suggestions(status);
create index if not exists idx_song_suggestions_song on public.song_suggestions(song_id);

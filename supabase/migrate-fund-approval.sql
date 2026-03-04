-- ============================================================
-- migrate-fund-approval.sql
-- เพิ่ม status / submitted_by / approved_by / approved_at / reject_reason
-- ให้ fund_transactions เพื่อรองรับระบบขออนุมัติ
-- ============================================================

-- 1. เพิ่มคอลัมน์ใหม่ (ข้อมูลเก่า = approved โดยอัตโนมัติ)
alter table public.fund_transactions
  add column if not exists status        text        not null default 'approved',
  add column if not exists submitted_by  text        default '',
  add column if not exists approved_by   text        default '',
  add column if not exists approved_at   timestamptz,
  add column if not exists reject_reason text        default '';

-- 2. รายการที่มีอยู่ก่อนหน้า → approved ทั้งหมด
update public.fund_transactions
  set status = 'approved'
  where status is null or status = '';

-- 3. Index ช่วยกรอง pending
create index if not exists idx_fund_tx_status
  on public.fund_transactions (band_id, status);

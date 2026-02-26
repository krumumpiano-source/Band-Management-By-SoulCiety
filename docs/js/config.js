/**
 * Band Management By SoulCiety — Supabase Config
 * ────────────────────────────────────────────────
 * วิธีดูค่าเหล่านี้:
 *   1. เข้า https://app.supabase.com → เลือก project
 *   2. ไป Settings → API
 *   3. คัดลอก "Project URL" และ "anon public" key
 *
 * ⚠️ ไฟล์นี้ public — ใส่เฉพาะ anon key เท่านั้น (ไม่ใส่ service_role)
 */
window._SB_CONFIG = {
  url:  'PASTE_YOUR_SUPABASE_URL_HERE',    // เช่น https://xxxyyyzzz.supabase.co
  anon: 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE' // เช่น eyJhbGciOi...
};

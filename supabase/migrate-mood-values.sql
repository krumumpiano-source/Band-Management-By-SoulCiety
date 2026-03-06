-- ============================================================
-- migrate-mood-values.sql
-- อัปเดตค่า mood เก่าใน band_songs ให้ตรงกับ option ใหม่
--
-- ค่าเดิม         → ค่าใหม่
-- สุข / สนุก     → มัน / สนุก
-- เศร้า / เหงา   → เศร้า / อกหัก
-- หวาน / อบอุ่น  → หวาน / โรแมนติก
-- มัน / ฮึกเหิม  → ฮึกเหิม / ยิ่งใหญ่
-- นิ่ง / ผ่อนคลาย → (ไม่เปลี่ยน)
-- ============================================================

-- 1. ดูจำนวนก่อน migrate (optional)
SELECT mood, COUNT(*) AS cnt
FROM band_songs
WHERE mood IN ('สุข / สนุก','เศร้า / เหงา','หวาน / อบอุ่น','มัน / ฮึกเหิม')
GROUP BY mood
ORDER BY mood;

-- 2. Migrate
UPDATE band_songs SET mood = 'มัน / สนุก'          WHERE mood = 'สุข / สนุก';
UPDATE band_songs SET mood = 'เศร้า / อกหัก'        WHERE mood = 'เศร้า / เหงา';
UPDATE band_songs SET mood = 'หวาน / โรแมนติก'      WHERE mood = 'หวาน / อบอุ่น';
UPDATE band_songs SET mood = 'ฮึกเหิม / ยิ่งใหญ่'  WHERE mood = 'มัน / ฮึกเหิม';

-- 3. ตรวจสอบหลัง migrate
SELECT mood, COUNT(*) AS cnt
FROM band_songs
GROUP BY mood
ORDER BY mood;

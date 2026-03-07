-- ============================================================
-- Cleanup duplicate global songs in band_songs
-- Generated: 2026-03-07T07:20:18.499Z
-- ============================================================
BEGIN;

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Delete exact duplicates (keep best record)
-- ═══════════════════════════════════════════════════════════

-- 7 Years (Lukas Graham) — keep 7158f82a-f393-4309-9ba5-59b15ca6be57, delete 1
UPDATE band_songs SET "key" = '2b' WHERE id = '7158f82a-f393-4309-9ba5-59b15ca6be57';
DELETE FROM band_songs WHERE id = '426fcd1d-e8e8-4768-86f1-12b6e06e9949';

-- Adventure of a Lifetime (Coldplay) — keep fa8c1852-2991-43b5-bfef-0fa5a52b6630, delete 1
UPDATE band_songs SET bpm = '112', "key" = 'C' WHERE id = 'fa8c1852-2991-43b5-bfef-0fa5a52b6630';
DELETE FROM band_songs WHERE id = 'b508b5a6-a10f-4abd-862b-739d90a17d18';

-- At My Worst (Pink Sweat$) — keep 5fe5de3a-6120-49a7-a35b-4fc77147d86b, delete 1
UPDATE band_songs SET bpm = '92', "key" = 'C' WHERE id = '5fe5de3a-6120-49a7-a35b-4fc77147d86b';
DELETE FROM band_songs WHERE id = '217d9c10-507f-4e5a-bfe9-f2c1bea1a807';

-- Before I Fall in Love (Coco Lee) — keep 6f48f001-a6c4-43e8-a718-301a5f8c296e, delete 1
DELETE FROM band_songs WHERE id = '9432264a-ac2f-4e25-a2a7-84cfa8ba995b';

-- Cinderella (Tattoo Colour) — keep 1616aab3-2ec0-49c2-ace3-70f6ad4546a1, delete 1
DELETE FROM band_songs WHERE id = '2b7bf437-48aa-4b4b-bd7b-cf06797f9647';

-- Crazy in Love (Beyonce) — keep 52fd8b40-4107-4ba8-bfff-d1f6fbdeee61, delete 1
UPDATE band_songs SET bpm = '99', "key" = '1b' WHERE id = '52fd8b40-4107-4ba8-bfff-d1f6fbdeee61';
DELETE FROM band_songs WHERE id = '38ee01c3-5a25-4943-b2b9-4bad8abc20db';

-- Dance Monkey (Tones and I) — keep 506c1c52-6851-4afa-9917-8968e5644a60, delete 1
UPDATE band_songs SET "key" = '3#' WHERE id = '506c1c52-6851-4afa-9917-8968e5644a60';
DELETE FROM band_songs WHERE id = '69cd1306-0010-44ce-a003-a17a53fa6fb6';

-- Drunk Text (Henry Moodie) — keep d14bab40-a197-4bc8-9175-15e115ba8fc5, delete 1
UPDATE band_songs SET bpm = '93', "key" = 'C' WHERE id = 'd14bab40-a197-4bc8-9175-15e115ba8fc5';
DELETE FROM band_songs WHERE id = 'db53a7ca-1e4d-4cfd-82de-331e8615c3b3';

-- Eternal Flame (The Bangles) — keep 0c8ef0c6-1704-4221-bf2a-581be79a2ce0, delete 1
UPDATE band_songs SET "key" = '1#' WHERE id = '0c8ef0c6-1704-4221-bf2a-581be79a2ce0';
DELETE FROM band_songs WHERE id = 'ad7d7e60-599a-4a06-95df-cef3f55225eb';

-- Have I Told You Lately (Rod Stewart) — keep 1bb69315-7b07-4544-950f-08b205fabcd7, delete 1
UPDATE band_songs SET bpm = '70', "key" = '1#' WHERE id = '1bb69315-7b07-4544-950f-08b205fabcd7';
DELETE FROM band_songs WHERE id = 'f26037f7-7213-4059-91a2-d6fb7ecd588c';

-- Have You Ever Seen the Rain (CCR) — keep 9d0ecd15-49a3-4380-8ee3-7901b85ad9de, delete 1
UPDATE band_songs SET bpm = '116', "key" = 'C' WHERE id = '9d0ecd15-49a3-4380-8ee3-7901b85ad9de';
DELETE FROM band_songs WHERE id = '86f6914e-ed56-4c8a-9691-3ab61d12d6da';

-- I Will Always Love You (Whitney Houston) — keep 882e400e-2359-4bb7-9751-04cde6553ad2, delete 1
UPDATE band_songs SET bpm = '68', "key" = '3#' WHERE id = '882e400e-2359-4bb7-9751-04cde6553ad2';
DELETE FROM band_songs WHERE id = '29bee9f4-84a5-42cf-97ab-1c62a530c10a';

-- Just the Two of Us (Bill Withers) — keep 3c3a70f4-eee3-4581-8b14-d97c489b1d2a, delete 1
UPDATE band_songs SET bpm = '96', "key" = '4b' WHERE id = '3c3a70f4-eee3-4581-8b14-d97c489b1d2a';
DELETE FROM band_songs WHERE id = 'ee7ccda5-2068-43b7-87ad-198de8a68cd1';

-- Just the Way You Are (Bruno Mars) — keep c851da95-1633-41b6-9ca7-a47b2ab1f6e6, delete 1
UPDATE band_songs SET bpm = '110', "key" = '2#' WHERE id = 'c851da95-1633-41b6-9ca7-a47b2ab1f6e6';
DELETE FROM band_songs WHERE id = 'cceed5b6-3cbc-476e-a357-01cf088eb33a';

-- Leave the Door Open (Silk Sonic) — keep 79481050-95d9-408f-9376-b570a442fdc8, delete 1
UPDATE band_songs SET bpm = '74', "key" = 'C' WHERE id = '79481050-95d9-408f-9376-b570a442fdc8';
DELETE FROM band_songs WHERE id = 'f3f2cfbf-c4bc-4188-ac75-4f1300a3bee3';

-- Love Me Like You Do (Ellie Goulding) — keep 83da4252-0b65-4d75-bc54-20d691b361af, delete 1
UPDATE band_songs SET bpm = '95', "key" = '4b' WHERE id = '83da4252-0b65-4d75-bc54-20d691b361af';
DELETE FROM band_songs WHERE id = '3b799f66-c17a-41ce-b46b-8cea0ba504d2';

-- Love on Top (Beyonce) — keep b43c6395-75b8-465d-a1f5-fd666f1b7198, delete 1
UPDATE band_songs SET bpm = '100', "key" = '2#' WHERE id = 'b43c6395-75b8-465d-a1f5-fd666f1b7198';
DELETE FROM band_songs WHERE id = 'd8ff4f10-7468-4241-a56f-ca39890a121e';

-- Lucky (Jason Mraz ft. Colbie Caillat) — keep bee3e479-3f3b-4bdc-8fa2-3216c679d001, delete 1
UPDATE band_songs SET bpm = '129', "key" = 'C' WHERE id = 'bee3e479-3f3b-4bdc-8fa2-3216c679d001';
DELETE FROM band_songs WHERE id = '5d3fa657-7947-4867-83af-ef8d9f08c7fb';

-- Miss Call (Scrubb) — keep e9ccf316-b788-428c-a065-cacc3dde8b02, delete 1
UPDATE band_songs SET bpm = '80', "key" = '3b' WHERE id = 'e9ccf316-b788-428c-a065-cacc3dde8b02';
DELETE FROM band_songs WHERE id = '964108e6-d71d-43f4-a1f2-a6df0b73a237';

-- MOVE ON (ปราโมทย์ วิเลปะนะ) — keep 7e25678b-a483-4d63-9959-a9fcc1152ec4, delete 1
UPDATE band_songs SET bpm = '64' WHERE id = '7e25678b-a483-4d63-9959-a9fcc1152ec4';
DELETE FROM band_songs WHERE id = '2e974758-97d9-482b-ba8e-9680a285b436';

-- My Heart Will Go On (Celine Dion) — keep 30eb0607-bbea-4e37-9ea6-868f2d95d443, delete 1
UPDATE band_songs SET "key" = '4#' WHERE id = '30eb0607-bbea-4e37-9ea6-868f2d95d443';
DELETE FROM band_songs WHERE id = '463879be-0427-413e-8f1e-c16c57de0ba1';

-- My Love (Westlife) — keep 0867864c-ba60-4c60-a531-93735dd13983, delete 1
UPDATE band_songs SET bpm = '73', "key" = 'C' WHERE id = '0867864c-ba60-4c60-a531-93735dd13983';
DELETE FROM band_songs WHERE id = 'ce0b95e3-37d8-4a92-b113-e7374388bd98';

-- Ok นะคะ (แคทรียา อิงลิช) — keep 88c4ced1-920d-47c5-8022-01e1dd10509b, delete 1
DELETE FROM band_songs WHERE id = '1ee6491c-362b-4c10-821c-ba37d92a6495';

-- Perfect (Ed Sheeran) — keep b0b707e7-6c0e-4d7e-b4b1-62b89bcf724f, delete 1
UPDATE band_songs SET bpm = '95', "key" = '4b' WHERE id = 'b0b707e7-6c0e-4d7e-b4b1-62b89bcf724f';
DELETE FROM band_songs WHERE id = 'f610e981-b337-43fa-8636-4d542cd75eb2';

-- Proud Mary (Tina Turner) — keep 4052440d-38a0-40b0-b9bb-00022d82edcb, delete 1
DELETE FROM band_songs WHERE id = 'f9311ad9-6aee-4250-ac0e-5f28be5cde99';

-- Right Here Waiting (Richard Marx) — keep f039dd84-a1e4-4cb5-bd05-50f527386b54, delete 1
UPDATE band_songs SET "key" = 'C' WHERE id = 'f039dd84-a1e4-4cb5-bd05-50f527386b54';
DELETE FROM band_songs WHERE id = 'ae08bbb4-85b9-4ec4-a5c6-803f4df94dae';

-- Rocket to the Moon (Safeplanet) — keep 31f9ad56-7c61-434a-a438-066e07faa1fd, delete 1
UPDATE band_songs SET bpm = '74', "key" = '2#' WHERE id = '31f9ad56-7c61-434a-a438-066e07faa1fd';
DELETE FROM band_songs WHERE id = '882c0492-f1ff-4fae-b7fc-e3d99893bca1';

-- Rolling in the Deep (Adele) — keep 651b16c0-8a02-4871-a339-cff260d7b779, delete 1
UPDATE band_songs SET bpm = '105', "key" = '3b' WHERE id = '651b16c0-8a02-4871-a339-cff260d7b779';
DELETE FROM band_songs WHERE id = 'c9eff269-0a05-452f-a4dc-cd0b8a4c67f8';

-- Saving All My Love for You (Whitney Houston) — keep 0f451c11-34dc-4ab8-a85f-d6d004f769e1, delete 1
UPDATE band_songs SET bpm = '66', "key" = '3#' WHERE id = '0f451c11-34dc-4ab8-a85f-d6d004f769e1';
DELETE FROM band_songs WHERE id = '17b94a3e-327e-4363-8c5b-357e4690938c';

-- Set Fire to the Rain (Adele) — keep 27e53c38-edd7-4f0e-9eca-36430c25ad62, delete 1
UPDATE band_songs SET "key" = '1b' WHERE id = '27e53c38-edd7-4f0e-9eca-36430c25ad62';
DELETE FROM band_songs WHERE id = '35009e59-4f51-4474-a8ec-d07169878e2a';

-- Sunday Morning (Maroon 5) — keep 61f4d66a-a560-4288-84ac-4f21ae4f301f, delete 1
UPDATE band_songs SET bpm = '88', "key" = 'C' WHERE id = '61f4d66a-a560-4288-84ac-4f21ae4f301f';
DELETE FROM band_songs WHERE id = '5e448828-70c5-424c-b3f7-3bb84e9a5d42';

-- The Day You Went Away (M2M) — keep bb942fdc-2219-42f3-85d8-9efc751e8ed3, delete 1
UPDATE band_songs SET bpm = '95', "key" = '2#' WHERE id = 'bb942fdc-2219-42f3-85d8-9efc751e8ed3';
DELETE FROM band_songs WHERE id = '9bff8f43-5399-4384-a814-681b5f6228cf';

-- Thinking Out Loud (Ed Sheeran) — keep 4b7b6a29-0f7e-4ad5-8320-5d5d0639915e, delete 1
UPDATE band_songs SET bpm = '69', "key" = '2#' WHERE id = '4b7b6a29-0f7e-4ad5-8320-5d5d0639915e';
DELETE FROM band_songs WHERE id = '5eef2a59-12b0-408a-b68c-0d1efeab5d9d';

-- This Love (Maroon 5) — keep a1fc9e20-0811-4b94-bdb4-f0223f4a1940, delete 1
UPDATE band_songs SET bpm = '95', "key" = '3b' WHERE id = 'a1fc9e20-0811-4b94-bdb4-f0223f4a1940';
DELETE FROM band_songs WHERE id = '095d0160-9fa3-4d6f-b200-5202305d48ae';

-- Until I Found You (Stephen Sanchez) — keep ca02bc79-d1f6-49be-9b84-b45569af8089, delete 1
UPDATE band_songs SET bpm = '102', "key" = '2b' WHERE id = 'ca02bc79-d1f6-49be-9b84-b45569af8089';
DELETE FROM band_songs WHERE id = 'a714d1c8-eb96-45c8-b2f7-9fa05af0c8bf';

-- Whats Up (4 Non Blondes) — keep 0b261f5e-e76e-4efa-a2e5-4b72af33ac96, delete 1
UPDATE band_songs SET bpm = '64', "key" = '3#' WHERE id = '0b261f5e-e76e-4efa-a2e5-4b72af33ac96';
DELETE FROM band_songs WHERE id = 'f8d3e3b7-c010-4551-8156-24de945fe478';

-- When You Say Nothing at All (Ronan Keating) — keep 0a0f0f01-aca6-4cc7-af0c-67a9e851ebe3, delete 1
UPDATE band_songs SET bpm = '88', "key" = '1#' WHERE id = '0a0f0f01-aca6-4cc7-af0c-67a9e851ebe3';
DELETE FROM band_songs WHERE id = '9f4c5558-a513-4f77-bc8b-65777c58f1e6';

-- Without You (Mariah Carey) — keep 9f2aaaf9-ba76-4c7b-bf28-bddd2d26b20a, delete 1
UPDATE band_songs SET bpm = '62', "key" = '6b' WHERE id = '9f2aaaf9-ba76-4c7b-bf28-bddd2d26b20a';
DELETE FROM band_songs WHERE id = '0de1e8f8-03f1-47a4-89dc-d8c35931f562';

-- Wonderful Tonight (Eric Clapton) — keep 4d69b612-052f-4f90-aa5f-e08dec61f427, delete 1
UPDATE band_songs SET bpm = '96', "key" = '1#' WHERE id = '4d69b612-052f-4f90-aa5f-e08dec61f427';
DELETE FROM band_songs WHERE id = '01bd8791-f298-47f3-95bd-bb19b4f600f0';

-- Yellow (Coldplay) — keep 6e41d348-6713-4cf4-b18b-b1ab882c49bf, delete 1
UPDATE band_songs SET bpm = '87', "key" = '5#' WHERE id = '6e41d348-6713-4cf4-b18b-b1ab882c49bf';
DELETE FROM band_songs WHERE id = '203fe279-4278-4f04-9132-531fb3d23c74';

-- Yesterday (The Beatles) — keep e5a32060-ad18-4958-a5c1-afdc3676108b, delete 1
UPDATE band_songs SET bpm = '97', "key" = '1b' WHERE id = 'e5a32060-ad18-4958-a5c1-afdc3676108b';
DELETE FROM band_songs WHERE id = '3a35d3d6-9be3-4a87-be21-e8b900b8421f';

-- Yesterday Once More (Carpenters) — keep 6466a593-43b4-4a9e-982c-fae657ffcd9a, delete 1
UPDATE band_songs SET bpm = '85', "key" = '4#' WHERE id = '6466a593-43b4-4a9e-982c-fae657ffcd9a';
DELETE FROM band_songs WHERE id = 'bc62178b-e410-4604-9892-290ea62889d2';

-- กลับดึก (ใหม่ เจริญปุระ) — keep 507c4cd6-9b61-4dfa-8d6e-820c5774c9fa, delete 1
DELETE FROM band_songs WHERE id = 'd3b65e63-3c75-4f21-9595-47ba60201a70';

-- กอดฉัน (วารุณี สุนทรีสวัสดิ์) — keep ca115a0a-501e-49ce-a9eb-0076321f36ed, delete 1
DELETE FROM band_songs WHERE id = 'cb5abae9-b29b-439c-8e76-1b19b8b318e0';

-- ก่อน (โมเดิร์นด็อก) — keep ef45c346-bdb7-4e17-899c-e30133e5b0c2, delete 1
DELETE FROM band_songs WHERE id = '55157774-ada6-43a2-a169-eb4cba1f78bd';

-- กุหลาบแดง (ไกรสร เรืองศรี) — keep a5324e29-df48-4bca-a9e3-c2144668bcd6, delete 1
DELETE FROM band_songs WHERE id = 'fc6a0ef1-8128-4ebc-b264-8293a5c22159';

-- เก็บซ่อน (พั้นช์ วรกาญจน์) — keep 93e4e6f4-588c-4f92-8e74-bb946875d35c, delete 1
DELETE FROM band_songs WHERE id = 'e33b55ec-e0a5-4b5c-bde9-99c7effa4e4e';

-- โกหกหน้าตาย (เท่ห์ อุเทน) — keep 4cb0d1b0-53ff-45cf-9239-de52e93f35b2, delete 1
DELETE FROM band_songs WHERE id = 'edfd3f2f-5960-4ced-8c6b-06d5fdc7b04c';

-- ขวากหนาม (ไฮ-ร็อก) — keep 93d89ea6-51ae-4d8a-a53f-69e9f3fdf141, delete 1
DELETE FROM band_songs WHERE id = 'fdb64f1b-298b-47ca-a667-740109b3164b';

-- ขอมือเธอหน่อย (นันทิดา แก้วบัวสาย) — keep 2e00eb55-9e73-42de-b4f3-8f412fe53d2c, delete 1
DELETE FROM band_songs WHERE id = 'e45e118b-4457-4df4-9470-373bb209c8fb';

-- ขาหมู (Tattoo Colour) — keep 4afcc903-dd3c-42e9-89cb-1af89a759c54, delete 1
DELETE FROM band_songs WHERE id = '1245b610-7ef0-49fa-8bff-3daf8244a16b';

-- ขีดเส้นใต้ (กบ ทรงสิทธิ์) — keep a46ad867-6c4f-4754-85ec-6e81c3073280, delete 1
DELETE FROM band_songs WHERE id = 'db3f62da-4efa-4808-b41a-66c79ed497f8';

-- คนทางนั้น (Gift My Project) — keep 076fa5f9-b0d0-414d-ad11-0762ccb277e7, delete 1
DELETE FROM band_songs WHERE id = '94f97d41-35de-4f71-9d78-8f038ca0c37c';

-- คนมีเสน่ห์ (ป้าง นครินทร์) — keep cf8bff6d-22d1-4242-8822-d2c8f66e57c8, delete 1
DELETE FROM band_songs WHERE id = '97682197-32e6-4744-9dfd-3e16af3ac9c0';

-- SKIP (different songs): ความลับ

-- ความหวาน (ลุลา) — keep 180660f6-fa71-47da-b4f6-e703a087b9d3, delete 1
DELETE FROM band_songs WHERE id = '181aed9e-a13e-462d-b5bc-fc3ce8d4a565';

-- คาใจ (เจ เจตริน) — keep 2477f4fe-063f-400a-a8c6-6046da917441, delete 1
DELETE FROM band_songs WHERE id = 'c582881f-f2f1-4265-8963-22a280b88e67';

-- SKIP (different songs): คิดถึง

-- คิดมาก (ปาล์มมี่) — keep 82b55a8a-07e1-4306-9dea-22d5f7fc6e3f, delete 1
DELETE FROM band_songs WHERE id = '8010dbd3-e001-4b8f-8ced-f29b6a9e50ac';

-- คืนข้ามปี (ดา เอ็นโดรฟิน) — keep 7b6df854-e8ac-413c-b72c-1591b20b5d7c, delete 1
DELETE FROM band_songs WHERE id = '388c97d1-0982-4462-b174-b4cbbeaa8b23';

-- จันทร์ (หญิง ธิติกานต์) — keep ef42bafc-fcb8-4d2a-ae0c-40454c407da5, delete 1
DELETE FROM band_songs WHERE id = 'fb38bd3d-c062-49f5-b78c-47afacf776c6';

-- SKIP (different songs): จิ๊จ๊ะ

-- เจ็บนิดเดียว (นิตยา บุญสูงเนิน) — keep 218ecbf2-f751-46ed-aaf8-be7e127afb6e, delete 1
DELETE FROM band_songs WHERE id = '49f26d98-e82d-4c9f-b44f-4842e33ddc4c';

-- ใจเหลือๆ (Dr.Fuu) — keep 99f1acfd-ac40-44c1-8d0b-819947e9af32, delete 1
DELETE FROM band_songs WHERE id = 'dfd206b7-f227-464a-b245-1cdbaa6674d9';

-- ฉากสุดท้าย (พัณนิดา เศวตาสัย) — keep 28d2fd99-efa3-4644-8f25-679d98857b78, delete 1
DELETE FROM band_songs WHERE id = '398f8806-9d0e-4eb6-add5-c95920b04671';

-- ชาวนากับงูเห่า (ฟลาย (Fly)) — keep 164d96cd-5c97-4514-b694-6f92ee570a4b, delete 1
DELETE FROM band_songs WHERE id = 'e18fcbb1-f75a-4c4d-a3cb-ff2eda250698';

-- ช้ำคือเรา (นิตยา บุญสูงเนิน) — keep 959619ef-f4ca-41c9-85b4-98a280ac5462, delete 1
DELETE FROM band_songs WHERE id = 'cc483119-70f2-4697-85fc-5deafaa43159';

-- ซมซาน (โลโซ) — keep 61322633-2a8f-4c71-b9af-8efee10ec65a, delete 1
DELETE FROM band_songs WHERE id = '5c4dff9e-b7ba-43f1-936d-0a043289096d';

-- ซ่อนกลิ่น (ปาล์มมี่) — keep 4af14a40-0862-4f68-8d59-91fd053d6188, delete 1
DELETE FROM band_songs WHERE id = '805590df-b0aa-4fda-b689-6f46cd1b6955';

-- ซักกะนิด (ทาทา ยัง) — keep e3ca31cf-b06a-41bb-8537-3538d9996584, delete 2
DELETE FROM band_songs WHERE id = 'f1e5ce03-5190-4a1f-9553-8e4116dc0bbc';
DELETE FROM band_songs WHERE id = '52c54bc2-939c-429b-a7f7-a1b06b2f1e69';

-- ดอกไม้กับแจกัน (ใหม่ เจริญปุระ) — keep 7704dce9-d0d4-494f-a8ed-af0aacdf6c6d, delete 1
DELETE FROM band_songs WHERE id = 'f186a3b8-5fe2-43f3-9ac3-c39e1424c61a';

-- ถ่านไฟเก่า (เบิร์ด ธงไชย) — keep 589dda74-6281-4b4c-9474-25672fc9790d, delete 1
DELETE FROM band_songs WHERE id = '83493d05-9df0-48fc-99d8-51276151291e';

-- ทรายกับทะเล (นันทิดา แก้วบัวสาย) — keep 7b2484ee-4284-482a-b4d1-99c6a3931cba, delete 1
DELETE FROM band_songs WHERE id = 'a0ca5d90-12f7-466a-95b0-69293bb3a239';

-- น้ำเต็มแก้ว (ดา เอ็นโดรฟิน) — keep 59858076-f6f4-488a-91bf-9d7e93852dd6, delete 1
DELETE FROM band_songs WHERE id = 'cd543950-dffc-45db-9273-a5a4985011fa';

-- SKIP (different songs): น้ำลาย

-- ประตูใจ (สาว สาว สาว) — keep 699d37d0-9ab8-415f-aecc-54877adadd41, delete 1
DELETE FROM band_songs WHERE id = 'a6eebf59-66a2-4203-9a9b-0ec30c5cb285';

-- ผ้าเช็ดหน้า (ไทรอัมพ์ส คิงดอม) — keep f0e60e0d-8048-450e-9d07-d3605fa9f0f9, delete 1
DELETE FROM band_songs WHERE id = 'b7ea7c3a-071a-426b-aa40-e6feeacf6348';

-- ผู้ชายในฝัน (ลำเพลิน วงศกร) — keep cc6cc67d-62e2-476a-ae5a-7c90321a60c7, delete 1
UPDATE band_songs SET "key" = '1b' WHERE id = 'cc6cc67d-62e2-476a-ae5a-7c90321a60c7';
DELETE FROM band_songs WHERE id = '4404c1f8-cac3-406f-ab73-fcb7b524592e';

-- ผู้ชายห่วยๆ (มาช่า วัฒนพานิช) — keep 110ebf0e-4f6a-4fb5-9cb4-d274621eb511, delete 1
DELETE FROM band_songs WHERE id = 'f65255a8-9a99-446c-9212-6e7e3cd5fe52';

-- ผู้ถูกเลือกให้ผิดหวัง (เรนิษรา) — keep 6fee5220-a87a-4c20-8d6d-2da56a8583e8, delete 1
DELETE FROM band_songs WHERE id = 'cf3d0c53-d48f-45a1-8a5d-9576c4a56af4';

-- ผู้หญิงลืมยาก (Pink) — keep 2a9d982d-12b8-4c17-a118-f285b4c81a02, delete 1
DELETE FROM band_songs WHERE id = '8c0a34e3-4969-433f-80b2-f5d596280aa7';

-- ฝากเลี้ยง (เจ เจตริน) — keep 073c0da3-5742-46c3-9af1-543175120e58, delete 1
DELETE FROM band_songs WHERE id = 'de676b67-e480-48d7-8754-2ec7e23d27d7';

-- พบรัก (แกรนด์เอ็กซ์) — keep cfc1b7d2-1b44-419f-8422-f14167faac19, delete 1
DELETE FROM band_songs WHERE id = 'babd2973-a5da-47f8-aa87-d8699a07554d';

-- พูดอีกที (คริสติน่า อากีล่าร์) — keep 3603d53f-395d-4622-ba31-edd6f7c5bcfd, delete 1
DELETE FROM band_songs WHERE id = '9ee19e54-d288-4632-a971-d1d7e8538a57';

-- เพื่อนสนิท (เอ็นโดรฟิน) — keep 3f1a0304-c694-4840-9cf4-e3708dd39c84, delete 1
DELETE FROM band_songs WHERE id = '6216f1dc-b4c7-4df7-8d11-e2af0f773f74';

-- แพ้ใจ (ใหม่ เจริญปุระ) — keep e7b23734-9fbe-407e-93aa-5b761eb49595, delete 1
DELETE FROM band_songs WHERE id = '86fa308c-e603-45fc-8509-8da6b4dad3e6';

-- แฟนเก่า (ลาบานูน) — keep 22041f32-fcf7-485e-839c-01d89fe581f9, delete 1
DELETE FROM band_songs WHERE id = '3c4cc334-eda0-4d5b-8e30-ac0619c8d84f';

-- ภาพลวงตา (ดา เอ็นโดรฟิน) — keep d882b530-abd2-4070-a252-642f127bee90, delete 1
DELETE FROM band_songs WHERE id = '8c8235e5-3dbd-4529-8a71-22e07f426e1c';

-- แม่มด (แสงระวี อัศวรักษ์) — keep d5ebbfbd-f7af-4bf6-93c6-86ffb65af17a, delete 1
DELETE FROM band_songs WHERE id = 'a2a6fcca-95e2-46ea-9725-f798e7d2205d';

-- ไม่ต้องมีคำบรรยาย (สไมล์บัฟฟาโล่) — keep 4618831e-176d-464a-bef2-04ccc36f7eab, delete 1
DELETE FROM band_songs WHERE id = '651201c0-36b3-405f-b651-d6ccd7857f76';

-- ไม่รักดี (เปเปอร์ แจม) — keep b53df58c-1bc6-4fa3-93e2-f8cc8828b9f4, delete 1
DELETE FROM band_songs WHERE id = 'f617a672-a4ec-4064-90bd-143aa77e1b4d';

-- ไม่สมศักดิ์ศรี (ไท ธนาวุฒิ) — keep 3de18056-1b71-4361-a24b-493ac4e379d3, delete 1
UPDATE band_songs SET bpm = '82', "key" = 'C' WHERE id = '3de18056-1b71-4361-a24b-493ac4e379d3';
DELETE FROM band_songs WHERE id = 'd6403d43-55b9-4a35-86da-a36e3f38a27e';

-- ไม่อาจเปลี่ยนใจ (เจมส์ เรืองศักดิ์) — keep a1dfb797-99df-43a2-979a-a747e6a4dbe7, delete 1
DELETE FROM band_songs WHERE id = 'dae2f984-a982-4c89-a988-50419ae99682';

-- ยิ่งกว่าเสียใจ (พั้นช์ วรกาญจน์) — keep 35acba78-153d-43c9-b42c-c9e6c672de39, delete 1
DELETE FROM band_songs WHERE id = '6ba15c42-030e-429d-a1c1-ab866b76b589';

-- รักเกินร้อย (ป๊อด (The Sun)) — keep c3b0ef88-c630-4fac-b76d-9d1bfd52131b, delete 1
DELETE FROM band_songs WHERE id = '51bb3823-32c1-49b8-912e-2da107b20ae7';

-- รักคนมีเจ้าของ (ไอน้ำ) — keep 56f8f574-cf7a-41e4-b9f8-4448e652838a, delete 1
DELETE FROM band_songs WHERE id = '10fc8f77-f16b-401a-9ea2-59608f3b455d';

-- รักคือฝันไป (สาว สาว สาว) — keep d4f82441-d738-4e31-836b-cbd7168b2c9c, delete 1
DELETE FROM band_songs WHERE id = '07f60b87-ac69-4b53-bcb1-b6a8bdbbbbd1';

-- รักสามเศร้า (พริกไทย) — keep e1d662cc-409f-484a-8990-ccc1248810d4, delete 1
DELETE FROM band_songs WHERE id = '636c6b47-633e-4bc1-be82-da94e79c9ee7';

-- เรามีเรา (แหวน ฐิติมา) — keep d16bfac2-1e73-4cc6-94f9-01c71708e143, delete 1
DELETE FROM band_songs WHERE id = 'bec9bc1e-a3d2-46d0-9524-d386ebc091ad';

-- ลมหายใจ (สมเกียรติ อริยะชัยพาณิชย์) — keep e9c5ae73-d2a8-4b0c-a60f-cfb944a22206, delete 1
DELETE FROM band_songs WHERE id = '8c04f65e-1831-4f58-9595-ca4a67cd9347';

-- เลือกได้ไหม (ซาซ่า) — keep 3d0c3520-bd56-433e-b45d-c0613a0310fa, delete 1
UPDATE band_songs SET bpm = '71', "key" = '4#' WHERE id = '3d0c3520-bd56-433e-b45d-c0613a0310fa';
DELETE FROM band_songs WHERE id = 'edf7d30e-2b42-4398-8483-1558aed28479';

-- วาดไว้ (BOWKYLION) — keep d70cd0c9-b2ed-4921-ae28-7b31ec951aa0, delete 1
DELETE FROM band_songs WHERE id = '6da79a8d-7776-4820-bb2a-8b6137817a21';

-- สลักจิต (ป๊อบ ft. ดา) — keep 3d69d6b8-7462-411b-86fe-fa1469ec6073, delete 1
DELETE FROM band_songs WHERE id = '9d0855ac-0599-4ed8-b48c-e413ee7bbf8b';

-- SKIP (different songs): สองใจ

-- สองรัก (Zeal) — keep 2d43ba4c-8bb0-4e7a-a1af-43777c87d2a7, delete 1
DELETE FROM band_songs WHERE id = '845f1324-6d5b-43cb-9b74-93ba40d307a9';

-- สักวันหนึ่ง (มาริสา สุโกศล) — keep 1de9b222-63ac-45b3-91b9-78791ae91657, delete 1
DELETE FROM band_songs WHERE id = '28d423ec-3c44-4ffa-9173-e3219c352858';

-- สิ่งสำคัญ (ดา เอ็นโดรฟิน) — keep e783172c-eedb-4371-9b06-c0554a82b0fb, delete 1
DELETE FROM band_songs WHERE id = '94ee75ec-b4fc-4291-b8ed-ac5ef6eace07';

-- สุดฤทธิ์สุดเดช (ใหม่ เจริญปุระ) — keep fd531cdd-1bd7-4311-a5b0-083cd3e214a1, delete 1
DELETE FROM band_songs WHERE id = '343870b7-7cf1-4715-bbfb-31b64d79a97c';

-- เสียงของหัวใจ (มาลีวัลย์ เจมีน่า) — keep 97944129-daa0-43ab-b27f-c84af346b099, delete 1
UPDATE band_songs SET "key" = '1#' WHERE id = '97944129-daa0-43ab-b27f-c84af346b099';
DELETE FROM band_songs WHERE id = '799aea47-36d3-407b-a7ec-58e8dcfd6ab0';

-- เสียใจได้ยินไหม (ใหม่ เจริญปุระ) — keep faaaef13-bc8c-4990-ab25-236d5c2a83ec, delete 1
DELETE FROM band_songs WHERE id = '2619f03d-f69f-44b9-820d-f3638b884702';

-- แสงสุดท้าย (บอดี้สแลม) — keep f7d99ad6-8cb8-492c-866a-45f7f4a3cbcd, delete 1
DELETE FROM band_songs WHERE id = '61a4b296-a925-4a2a-b307-07e534c448cf';

-- หมดห่วง (ตั๊ก ศิริพร) — keep 7bee985e-9d89-4611-9584-40fbe989ffa8, delete 1
DELETE FROM band_songs WHERE id = 'b9d7250c-8b60-4b42-adba-135c01a5fa32';

-- หมอกหรือควัน (เบิร์ด ธงไชย) — keep 63944936-05f6-4a17-87d9-9a400119e8a8, delete 1
DELETE FROM band_songs WHERE id = 'e56c7bb9-a478-4daf-896c-d870e54866b7';

-- หยุดตรงนี้ที่เธอ (ฟอร์ด สบชัย) — keep b675c406-8886-46c3-b525-2ac6175ebaec, delete 1
DELETE FROM band_songs WHERE id = '367b496d-0e7c-4a7b-86be-42a407f7fb51';

-- ไหนว่าจะไม่หลอกกัน (Silly Fools) — keep 61b6e6e0-4fa3-479b-8158-9c0bee3e11b5, delete 1
DELETE FROM band_songs WHERE id = 'f0f86a59-8eef-4ff5-879d-512957302fa0';

-- เอาปากกามาวง (Bell Warisara) — keep 91f8bac1-54dd-48d8-84fc-09348edff9bb, delete 1
DELETE FROM band_songs WHERE id = '75aabf35-08ab-4f6f-a7fb-b213ea87a87e';

-- โอ้ยๆ (แจ้ ดนุพล) — keep af6146c6-b4b3-4c9f-9373-1f9c8514d613, delete 1
DELETE FROM band_songs WHERE id = 'dce47cbc-8ea2-47c9-9154-e6e30644a5fe';

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Near-duplicates (apostrophe, spacing, etc.)
-- ═══════════════════════════════════════════════════════════

-- Near-dup: "Dont Look Back in Anger" -> "Don't look back in anger" (missing apostrophe)
DELETE FROM band_songs WHERE id = '9675889f-260d-4269-877c-81d89c639c1c';

-- Near-dup: "Good times" -> "Good Time" (plural)
DELETE FROM band_songs WHERE id = '8d49fc8d-3ec0-4c64-b301-cdfe88d5ea99';

-- Near-dup: "I Dont Want to Talk About It" -> "I don't want to talk about it" (missing apostrophe)
DELETE FROM band_songs WHERE id = '39632d54-e092-40c1-8693-8219071a9cf4';

-- Near-dup: "If I Aint Got You" -> "If i ain't got you" (missing apostrophe)
DELETE FROM band_songs WHERE id = '2c00ceec-f22f-4ab3-aeb7-4cc14c065c80';

-- Near-dup: "L.o.v.e" -> "L.O.V.E." (case)
DELETE FROM band_songs WHERE id = 'eac3cd8b-a021-47ef-8efb-9bc729f9c70c';

-- Near-dup: "The Lazy song" -> "Lazy Song" (extra 'The')
DELETE FROM band_songs WHERE id = 'aac5428d-5215-4447-a649-b0d42fe62288';

-- Near-dup: "Like Im Gonna Lose You" -> "like i'm gonna lose you (ตอง)" (missing apostrophe)
DELETE FROM band_songs WHERE id = 'db7818fb-79ed-4bd4-99ec-dd1e6b095df4';

-- Near-dup: "Pricetag" -> "Price Tag" (spacing)
DELETE FROM band_songs WHERE id = '34f3f510-0276-4fe7-82d0-65ff34cd09e7';

-- Near-dup: "Sky&sea" -> "Sky & Sea" (spacing)
DELETE FROM band_songs WHERE id = '708e388b-c900-4ce3-8214-f5278b2c0cc5';

-- Near-dup: "Tip toe" -> "Tiptoe" (spacing)
DELETE FROM band_songs WHERE id = 'c35e84b5-ee90-4054-a3ae-e3d7e3a89605';

-- Near-dup: "Too good at goodbye" -> "Too Good at Goodbyes" (plural)
DELETE FROM band_songs WHERE id = 'fa66a80e-c7e6-4029-8abe-52f8c7bbce6b';

-- Near-dup: "คิดถึงฉันไหมเวลาที่เธอ..." -> "คิดถึงฉันไหมเวลาที่เธอ" (trailing ...)
DELETE FROM band_songs WHERE id = '5fcd6fec-2bb2-459c-89a7-066b68f697d9';

-- Near-dup: "เมื่อเขามาฉันจะไป" -> "เมื่อเขามา...ฉันจะไป" (missing ...)
DELETE FROM band_songs WHERE id = '82094bef-3376-40bb-8836-48c0cace297a';

-- Near-dup: "ไม่รู้จักฉันไม่รู้จักเธอ" -> "ไม่รู้จักฉัน ไม่รู้จักเธอ" (missing space)
DELETE FROM band_songs WHERE id = '80c24e08-c46f-4e73-97b7-a86350e27af7';


-- ═══════════════════════════════════════════════════════════
-- SUMMARY: 127 deletes, 42 updates
-- ═══════════════════════════════════════════════════════════

COMMIT;
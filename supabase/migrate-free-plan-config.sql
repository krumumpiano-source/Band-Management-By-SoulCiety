-- Add free plan to plan_config so admin can configure it
INSERT INTO plan_config (id, price, label, features, active, max_members, allowed_pages, discount_percent)
VALUES (
  'free',
  0,
  'Free',
  '["มีโฆษณา","เข้าถึงฟีเจอร์พื้นฐาน","สมาชิกได้ 3 คน"]',
  true,
  3,
  '[]',
  0
)
ON CONFLICT (id) DO NOTHING;

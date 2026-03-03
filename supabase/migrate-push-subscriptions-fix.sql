-- ─────────────────────────────────────────────────────────────────
-- migrate-push-subscriptions-fix.sql
-- เพิ่ม UPDATE policy สำหรับ push_subscriptions
-- วิธีใช้: รันใน Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- เพิ่ม UPDATE policy (จำเป็นสำหรับ upsert เมื่อ row มีอยู่แล้ว)
DO $d$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions' AND policyname = 'user updates own subscription'
  ) THEN
    CREATE POLICY "user updates own subscription"
      ON push_subscriptions FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $d$;

-- Add payment method columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_method  text default '',
  ADD COLUMN IF NOT EXISTS payment_account text default '';

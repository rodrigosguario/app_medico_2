-- Add notification preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sync_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_reports boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_reminders boolean DEFAULT true;
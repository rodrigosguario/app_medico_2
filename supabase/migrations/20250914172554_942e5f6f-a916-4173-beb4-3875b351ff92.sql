-- Add unique constraint for calendar_sync_settings to support upsert operations
ALTER TABLE public.calendar_sync_settings 
ADD CONSTRAINT calendar_sync_settings_user_provider_unique 
UNIQUE (user_id, provider);
-- Enable pg_cron extension for automatic calendar synchronization
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to automatically sync Google Calendar for all connected users
CREATE OR REPLACE FUNCTION sync_all_google_calendars()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users with active Google Calendar connections
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM calendar_sync_settings 
        WHERE provider = 'google' 
        AND is_enabled = true 
        AND access_token IS NOT NULL
    LOOP
        -- Call the Google Calendar sync edge function for each user
        PERFORM net.http_post(
            url := 'https://kmwsoppkrjzjioeadtqb.supabase.co/functions/v1/google-calendar-sync',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
            ),
            body := jsonb_build_object(
                'action', 'sync',
                'userId', user_record.user_id
            )
        );
    END LOOP;
END;
$$;

-- Schedule automatic sync every 30 minutes
SELECT cron.schedule(
    'google-calendar-auto-sync',
    '*/30 * * * *', -- Every 30 minutes
    'SELECT sync_all_google_calendars();'
);
-- Fix security issues from the linter

-- Fix the sync function with proper search_path
CREATE OR REPLACE FUNCTION sync_all_google_calendars()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix existing functions by adding search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN 
    INSERT INTO public.profiles (user_id, name, email, crm, specialty) 
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'name', ''), 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'crm', ''), 
        COALESCE(new.raw_user_meta_data->>'specialty', '')
    ); 
    RETURN new; 
END; 
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
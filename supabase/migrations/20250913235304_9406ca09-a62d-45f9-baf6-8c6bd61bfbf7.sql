-- Add external sync fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_source TEXT,
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for external sync lookups
CREATE INDEX IF NOT EXISTS idx_events_external_id ON public.events(external_id, external_source);
CREATE INDEX IF NOT EXISTS idx_events_last_synced ON public.events(last_synced);

-- Create calendar sync settings table
CREATE TABLE IF NOT EXISTS public.calendar_sync_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'icloud', 'plantoesbr'
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional', -- 'import', 'export', 'bidirectional'
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_sync_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_sync_settings
CREATE POLICY "Users can view their own sync settings" 
ON public.calendar_sync_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync settings" 
ON public.calendar_sync_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync settings" 
ON public.calendar_sync_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync settings" 
ON public.calendar_sync_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_sync_settings_updated_at
BEFORE UPDATE ON public.calendar_sync_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sync history table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'import', 'export', 'bidirectional'
  events_processed INTEGER DEFAULT 0,
  events_succeeded INTEGER DEFAULT 0,
  events_failed INTEGER DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}'
);

-- Enable RLS for sync_history
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_history
CREATE POLICY "Users can view their own sync history" 
ON public.sync_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create webhook table for external calendar notifications
CREATE TABLE IF NOT EXISTS public.calendar_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  expiration TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for webhooks
ALTER TABLE public.calendar_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for webhooks
CREATE POLICY "Users can view their own webhooks" 
ON public.calendar_webhooks 
FOR SELECT 
USING (auth.uid() = user_id);
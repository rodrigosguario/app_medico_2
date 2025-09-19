-- Criar tabela para armazenar credenciais de calendários externos (Google, Outlook, etc.)
CREATE TABLE public.calendar_credentials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL, -- 'google', 'outlook', etc.
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Garantir que cada usuário tenha apenas uma credencial por provedor
    UNIQUE(user_id, provider_id)
);

-- Índices para performance
CREATE INDEX idx_calendar_credentials_user_id ON public.calendar_credentials(user_id);
CREATE INDEX idx_calendar_credentials_provider ON public.calendar_credentials(provider_id);
CREATE INDEX idx_calendar_credentials_expires_at ON public.calendar_credentials(expires_at);

-- Habilitar RLS
ALTER TABLE public.calendar_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuários só podem ver suas próprias credenciais
CREATE POLICY "Users can view their own calendar credentials" 
ON public.calendar_credentials FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar credentials" 
ON public.calendar_credentials FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar credentials" 
ON public.calendar_credentials FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar credentials" 
ON public.calendar_credentials FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_calendar_credentials_updated_at
    BEFORE UPDATE ON public.calendar_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para sincronização automática
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_credentials;

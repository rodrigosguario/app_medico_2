-- Criação das tabelas principais do MedicoAgenda
-- 1. Tabela de perfis de médicos
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(crm)
);

-- 2. Tabela de hospitais
CREATE TABLE public.hospitals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(120),
    cnpj VARCHAR(18),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de calendários
CREATE TABLE public.calendars (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('PLANTAO', 'AMBULATORIO', 'ACADEMICO', 'FINANCEIRO', 'PESSOAL', 'ADMINISTRATIVO')),
    color VARCHAR(7) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de eventos
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    calendar_id UUID NOT NULL REFERENCES public.calendars ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('PLANTAO', 'CONSULTA', 'PROCEDIMENTO', 'AULA', 'REUNIAO', 'ADMINISTRATIVO', 'PESSOAL')),
    status VARCHAR(20) DEFAULT 'CONFIRMADO' CHECK (status IN ('CONFIRMADO', 'TENTATIVO', 'AGUARDANDO', 'CANCELADO', 'REALIZADO', 'NAO_REALIZADO')),
    value DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabela de eventos financeiros
CREATE TABLE public.financial_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    event_id UUID REFERENCES public.events ON DELETE SET NULL,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('RECEITA', 'DESPESA')),
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50),
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criação de índices para performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_calendars_user_id ON public.calendars(user_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_calendar_id ON public.events(calendar_id);
CREATE INDEX idx_financial_events_user_id ON public.financial_events(user_id);
CREATE INDEX idx_financial_events_date ON public.financial_events(date);

-- Habilitação de RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para hospitais (público para leitura, apenas admins para escrita)
CREATE POLICY "Anyone can view hospitals" 
ON public.hospitals FOR SELECT 
USING (true);

-- Políticas RLS para calendários
CREATE POLICY "Users can view their own calendars" 
ON public.calendars FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendars" 
ON public.calendars FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendars" 
ON public.calendars FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendars" 
ON public.calendars FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para eventos
CREATE POLICY "Users can view their own events" 
ON public.events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.events FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para eventos financeiros
CREATE POLICY "Users can view their own financial events" 
ON public.financial_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial events" 
ON public.financial_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial events" 
ON public.financial_events FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial events" 
ON public.financial_events FOR DELETE 
USING (auth.uid() = user_id);

-- Função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualização automática de timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendars_updated_at
    BEFORE UPDATE ON public.calendars
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_events_updated_at
    BEFORE UPDATE ON public.financial_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, email, crm, specialty)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', 'Novo Usuário'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'crm', 'CRM_PENDENTE'),
        COALESCE(NEW.raw_user_meta_data ->> 'specialty', 'Especialidade não definida')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserção de dados de exemplo (hospitais)
INSERT INTO public.hospitals (name, address, phone, email) VALUES
('Hospital Sírio-Libanês', 'Rua Dona Adma Jafet, 91 - Bela Vista, São Paulo - SP', '(11) 3155-1000', 'contato@hsl.org.br'),
('Hospital Albert Einstein', 'Av. Albert Einstein, 627 - Morumbi, São Paulo - SP', '(11) 2151-1233', 'contato@einstein.br'),
('Hospital das Clínicas - FMUSP', 'Rua Dr. Enéas Carvalho de Aguiar, 44 - Cerqueira César, São Paulo - SP', '(11) 2661-0000', 'contato@hc.fm.usp.br');

-- Habilitar realtime para sincronização automática
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
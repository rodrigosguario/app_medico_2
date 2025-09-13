-- Create default calendar for existing users and new users
INSERT INTO public.calendars (user_id, name, category, color, description, is_active)
SELECT 
    p.user_id,
    'Calendário Principal',
    'GERAL',
    '#3B82F6',
    'Calendário principal para todos os eventos',
    true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.calendars c WHERE c.user_id = p.user_id
);

-- Create function to automatically create default calendar for new users
CREATE OR REPLACE FUNCTION public.create_default_calendar_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create default calendar for new user
    INSERT INTO public.calendars (user_id, name, category, color, description, is_active)
    VALUES (
        NEW.user_id,
        'Calendário Principal',
        'GERAL',
        '#3B82F6',
        'Calendário principal para todos os eventos',
        true
    );
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create default calendar when profile is created
CREATE TRIGGER create_default_calendar_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_default_calendar_for_user();

-- Add some example hospitals if none exist
INSERT INTO public.hospitals (name, address, phone, email, cnpj, is_active)
VALUES 
    ('Hospital Geral', 'Rua das Flores, 123 - Centro', '(11) 3333-4444', 'contato@hospitalgeral.com.br', '12.345.678/0001-90', true),
    ('Santa Casa', 'Av. Principal, 456 - Bairro Novo', '(11) 5555-6666', 'admin@santacasa.org.br', '98.765.432/0001-10', true),
    ('Hospital São Lucas', 'Rua da Saúde, 789 - Vila Médica', '(11) 7777-8888', 'info@saolucas.com.br', '11.222.333/0001-44', true)
ON CONFLICT DO NOTHING;

-- Add foreign key constraint for events.calendar_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'events_calendar_id_fkey' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE public.events 
        ADD CONSTRAINT events_calendar_id_fkey 
        FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for events.hospital_id if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'events_hospital_id_fkey' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE public.events 
        ADD CONSTRAINT events_hospital_id_fkey 
        FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL;
    END IF;
END $$;
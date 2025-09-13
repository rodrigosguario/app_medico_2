-- Create default calendar for existing users with correct category
INSERT INTO public.calendars (user_id, name, category, color, description, is_active)
SELECT 
    p.user_id,
    'Calendário Principal',
    'PESSOAL',
    '#3B82F6',
    'Calendário principal para todos os eventos',
    true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.calendars c WHERE c.user_id = p.user_id
);

-- Update the function to use correct category
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
        'PESSOAL',
        '#3B82F6',
        'Calendário principal para todos os eventos',
        true
    );
    RETURN NEW;
END;
$$;

-- Add some example hospitals if none exist
INSERT INTO public.hospitals (name, address, phone, email, cnpj, is_active)
VALUES 
    ('Hospital Geral', 'Rua das Flores, 123 - Centro', '(11) 3333-4444', 'contato@hospitalgeral.com.br', '12.345.678/0001-90', true),
    ('Santa Casa', 'Av. Principal, 456 - Bairro Novo', '(11) 5555-6666', 'admin@santacasa.org.br', '98.765.432/0001-10', true),
    ('Hospital São Lucas', 'Rua da Saúde, 789 - Vila Médica', '(11) 7777-8888', 'info@saolucas.com.br', '11.222.333/0001-44', true)
ON CONFLICT DO NOTHING;

-- Add foreign key constraints
ALTER TABLE public.events 
ADD CONSTRAINT events_calendar_id_fkey 
FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD CONSTRAINT events_hospital_id_fkey 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL;
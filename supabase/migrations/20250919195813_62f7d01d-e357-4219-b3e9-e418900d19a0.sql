-- Adicionar campos de imposto na tabela events
ALTER TABLE public.events 
ADD COLUMN tax_rate NUMERIC(5,2) DEFAULT NULL,
ADD COLUMN tax_type TEXT DEFAULT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.events.tax_rate IS 'Taxa de imposto específica para este evento (em %)';
COMMENT ON COLUMN public.events.tax_type IS 'Tipo de imposto aplicado a este evento (ex: simples_nacional, sociedade_simples_limitada)';
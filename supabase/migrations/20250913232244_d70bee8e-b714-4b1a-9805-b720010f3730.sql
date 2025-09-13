-- Add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN value numeric DEFAULT 0;

-- Add missing columns to financial_events table  
ALTER TABLE public.financial_events 
ADD COLUMN is_paid boolean DEFAULT false,
ADD COLUMN payment_method text DEFAULT NULL;
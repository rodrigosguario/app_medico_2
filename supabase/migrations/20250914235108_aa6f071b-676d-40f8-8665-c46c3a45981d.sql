-- First, let's allow users to manage hospitals
-- Update RLS policies for hospitals table to allow users to insert/update/delete their own hospitals

-- Add user_id column to hospitals table to track ownership
ALTER TABLE public.hospitals ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update existing hospitals to be owned by system (null user_id for global hospitals)
-- Users can see all hospitals but only edit their own

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Anyone can view active hospitals" ON public.hospitals;

-- Create new policies
CREATE POLICY "Users can view all active hospitals" 
ON public.hospitals 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create their own hospitals" 
ON public.hospitals 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND is_active = true
);

CREATE POLICY "Users can update their own hospitals" 
ON public.hospitals 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hospitals" 
ON public.hospitals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add tax configuration to profiles table
ALTER TABLE public.profiles ADD COLUMN tax_rate NUMERIC(5,2) DEFAULT 6.00;
ALTER TABLE public.profiles ADD COLUMN tax_type TEXT DEFAULT 'simples_nacional';

-- Add check constraint for tax_type
ALTER TABLE public.profiles ADD CONSTRAINT check_tax_type 
CHECK (tax_type IN ('simples_nacional', 'sociedade_simples_limitada', 'mei', 'other'));

-- Update the trigger function to handle timestamp updates
CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
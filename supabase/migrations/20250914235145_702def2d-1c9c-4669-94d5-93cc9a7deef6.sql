-- Allow users to manage hospitals
-- Add user_id column to hospitals table to track ownership
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 6.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'simples_nacional';

-- Add check constraint for tax_type
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_tax_type;
ALTER TABLE public.profiles ADD CONSTRAINT check_tax_type 
CHECK (tax_type IN ('simples_nacional', 'sociedade_simples_limitada', 'mei', 'other'));
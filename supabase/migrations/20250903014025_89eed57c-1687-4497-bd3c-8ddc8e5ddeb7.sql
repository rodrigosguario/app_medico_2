-- First, let's check what constraints exist and drop the problematic one
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.calendars'::regclass;
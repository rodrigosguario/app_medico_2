-- Fix the security definer view issue by dropping the conflicting view
-- There's already a calendar_status table, so we don't need the view

DROP VIEW IF EXISTS public.calendar_status;
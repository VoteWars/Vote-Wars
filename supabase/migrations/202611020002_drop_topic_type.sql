-- VoteWars Migration: Remove types completely from topics table
ALTER TABLE public.topics ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS topics_type_check;
ALTER TABLE public.topics DROP COLUMN IF EXISTS type;

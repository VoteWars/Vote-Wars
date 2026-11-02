-- Idempotent cleanup for databases that still have the retired topics.type column.
ALTER TABLE public.topics DROP COLUMN IF EXISTS type;

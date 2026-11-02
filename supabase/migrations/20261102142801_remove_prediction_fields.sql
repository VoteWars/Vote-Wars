-- Remove the retired topic-type / prediction-answer feature completely.
-- Safe for databases that already applied the migration that dropped topics.type.
ALTER TABLE public.topics DROP COLUMN IF EXISTS type;
ALTER TABLE public.topics DROP COLUMN IF EXISTS correct_option_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS predict_it_attempts;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS predict_it_correct;

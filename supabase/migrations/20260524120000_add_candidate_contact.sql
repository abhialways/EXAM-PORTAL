-- Add candidate_contact column to exam_schedules and exam_round_results

ALTER TABLE public.exam_schedules
ADD COLUMN IF NOT EXISTS candidate_contact TEXT DEFAULT '';

ALTER TABLE public.exam_round_results
ADD COLUMN IF NOT EXISTS candidate_contact TEXT DEFAULT '';

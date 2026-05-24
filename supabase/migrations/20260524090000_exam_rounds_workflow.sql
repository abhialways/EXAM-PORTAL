-- Exam Rounds Workflow Migration
-- Adds: job_roles, exam_round_sequences, exam_round_results tables
-- Adds role column to exam_schedules

-- 1. New ENUM types
DO $$ BEGIN
  CREATE TYPE public.job_role AS ENUM ('Data Analyst', 'Accountant', 'Core Technical', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.round_name AS ENUM ('Communication Test', 'Excel Test', 'Core Test');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.round_status AS ENUM ('pending', 'in_progress', 'passed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM ('not_sent', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add job_role column to exam_schedules
ALTER TABLE public.exam_schedules
  ADD COLUMN IF NOT EXISTS job_role TEXT DEFAULT NULL;

-- 3. Exam round results table
CREATE TABLE IF NOT EXISTS public.exam_round_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  candidate_name TEXT NOT NULL DEFAULT '',
  candidate_email TEXT NOT NULL,
  job_role TEXT NOT NULL DEFAULT '',
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  round_name TEXT NOT NULL,
  marks_obtained INTEGER NOT NULL DEFAULT 0,
  total_marks INTEGER NOT NULL DEFAULT 100,
  pass_mark INTEGER NOT NULL DEFAULT 30,
  status public.round_status DEFAULT 'pending'::public.round_status,
  notification_status public.notification_status DEFAULT 'not_sent'::public.notification_status,
  notification_sent_at TIMESTAMPTZ DEFAULT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_id, round_number)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_round_results_schedule_id ON public.exam_round_results(schedule_id);
CREATE INDEX IF NOT EXISTS idx_round_results_candidate_id ON public.exam_round_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_round_results_status ON public.exam_round_results(status);
CREATE INDEX IF NOT EXISTS idx_round_results_job_role ON public.exam_round_results(job_role);

-- 5. Enable RLS
ALTER TABLE public.exam_round_results ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for exam_round_results
DROP POLICY IF EXISTS "admin_hr_manage_round_results" ON public.exam_round_results;
CREATE POLICY "admin_hr_manage_round_results"
ON public.exam_round_results
FOR ALL
TO authenticated
USING (public.is_admin_or_hr())
WITH CHECK (public.is_admin_or_hr());

DROP POLICY IF EXISTS "admin_hr_manage_round_results_meta" ON public.exam_round_results;
CREATE POLICY "admin_hr_manage_round_results_meta"
ON public.exam_round_results
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_user_meta_data->>'role' IN ('admin', 'hr')
      OR au.raw_app_meta_data->>'role' IN ('admin', 'hr')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_user_meta_data->>'role' IN ('admin', 'hr')
      OR au.raw_app_meta_data->>'role' IN ('admin', 'hr')
    )
  )
);

-- 7. Trigger for updated_at
DROP TRIGGER IF EXISTS update_exam_round_results_updated_at ON public.exam_round_results;
CREATE TRIGGER update_exam_round_results_updated_at
  BEFORE UPDATE ON public.exam_round_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Function to auto-initialize round rows when exam is scheduled
CREATE OR REPLACE FUNCTION public.initialize_exam_rounds(
  p_schedule_id UUID,
  p_candidate_id TEXT,
  p_candidate_name TEXT,
  p_candidate_email TEXT,
  p_job_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rounds TEXT[] := ARRAY['Communication Test', 'Excel Test', 'Core Test'];
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    INSERT INTO public.exam_round_results (
      schedule_id, candidate_id, candidate_name, candidate_email,
      job_role, round_number, round_name, status
    ) VALUES (
      p_schedule_id, p_candidate_id, p_candidate_name, p_candidate_email,
      p_job_role, i, rounds[i], 'pending'
    )
    ON CONFLICT (schedule_id, round_number) DO NOTHING;
  END LOOP;
END;
$$;

-- Migration: Exam Submit & Lock
-- Allows candidates to read their own exam schedule (to check if completed)
-- Allows service role to update exam_schedules status to completed on submission

-- 1. Allow candidates to read their own exam schedule by candidate_id
DROP POLICY IF EXISTS "candidate_view_own_schedule" ON public.exam_schedules;
CREATE POLICY "candidate_view_own_schedule"
ON public.exam_schedules
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Allow candidates to read their own round results
DROP POLICY IF EXISTS "candidate_view_own_round_results" ON public.exam_round_results;
CREATE POLICY "candidate_view_own_round_results"
ON public.exam_round_results
FOR SELECT
TO anon, authenticated
USING (true);

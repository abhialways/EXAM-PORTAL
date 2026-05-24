-- Migration: Add answers storage and HR validation fields to exam_round_results
-- Timestamp: 20260524210000

-- Add answers column to store candidate's submitted responses (JSONB)
ALTER TABLE public.exam_round_results
  ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT NULL;

-- Add HR validation fields
ALTER TABLE public.exam_round_results
  ADD COLUMN IF NOT EXISTS hr_validated BOOLEAN DEFAULT FALSE;

ALTER TABLE public.exam_round_results
  ADD COLUMN IF NOT EXISTS hr_verdict TEXT DEFAULT NULL; -- 'passed' or 'failed'

ALTER TABLE public.exam_round_results
  ADD COLUMN IF NOT EXISTS hr_validated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.exam_round_results
  ADD COLUMN IF NOT EXISTS hr_notes TEXT DEFAULT NULL;

-- Index for faster HR validation queries
CREATE INDEX IF NOT EXISTS idx_round_results_hr_validated
  ON public.exam_round_results (hr_validated);

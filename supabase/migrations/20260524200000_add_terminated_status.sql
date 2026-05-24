-- Migration: Add notes column and terminated status support to exam_schedules
-- Timestamp: 20260524200000

-- Add notes column for termination reason
ALTER TABLE public.exam_schedules
ADD COLUMN IF NOT EXISTS notes TEXT;

-- The status column already exists; we just need to ensure 'terminated' is a valid value.
-- Since status is likely TEXT (not ENUM), this is already supported.
-- If it's an ENUM, we need to add the value:
DO $$
BEGIN
  -- Check if status column is an enum type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exam_schedules'
      AND column_name = 'status'
      AND udt_name NOT IN ('text', 'varchar', 'character varying')
  ) THEN
    -- Try to add 'terminated' to the enum if it doesn't exist
    BEGIN
      ALTER TYPE public.exam_status ADD VALUE IF NOT EXISTS 'terminated';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add terminated to enum: %', SQLERRM;
    END;
  END IF;
END $$;

-- Create index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_exam_schedules_status_date
  ON public.exam_schedules (status, exam_date);

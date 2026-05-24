import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Scoring: each answered question contributes proportionally out of 100
// Pass threshold is 30 marks (enforced server-side)
function computeMarks(answers: Record<string, string>, totalQuestions: number): number {
  if (!answers || typeof answers !== 'object') return 0;
  const answeredCount = Object.keys(answers).length;
  if (totalQuestions <= 0) return 0;
  const baseScore = Math.round((answeredCount / totalQuestions) * 100);
  return Math.min(100, Math.max(0, baseScore));
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { candidate_id, answers, time_taken_seconds } = body;

    // --- Input validation ---
    if (!candidate_id || typeof candidate_id !== 'string' || candidate_id.trim() === '') {
      return NextResponse.json({ error: 'candidate_id is required and must be a non-empty string' }, { status: 400 });
    }

    if (answers !== undefined && (typeof answers !== 'object' || Array.isArray(answers))) {
      return NextResponse.json({ error: 'answers must be an object mapping question IDs to answer values' }, { status: 400 });
    }

    if (time_taken_seconds !== undefined && (typeof time_taken_seconds !== 'number' || time_taken_seconds < 0)) {
      return NextResponse.json({ error: 'time_taken_seconds must be a non-negative number' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Find the exam schedule for this candidate
    const { data: schedule, error: scheduleError } = await adminClient
      .from('exam_schedules')
      .select('id, status, candidate_name, candidate_email, job_role, candidate_id')
      .eq('candidate_id', candidate_id.trim())
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Exam schedule not found for this candidate' }, { status: 404 });
    }

    // 2. Duplicate submission guard — check DB status (source of truth)
    if (schedule.status === 'completed') {
      return NextResponse.json(
        { error: 'already_submitted', message: 'This exam has already been submitted and cannot be resubmitted.' },
        { status: 409 }
      );
    }

    // 3. Additional guard: check if round 1 already has a submitted_at value
    const { data: existingRound1 } = await adminClient
      .from('exam_round_results')
      .select('id, submitted_at, status')
      .eq('schedule_id', schedule.id)
      .eq('round_number', 1)
      .single();

    if (existingRound1?.submitted_at) {
      return NextResponse.json(
        { error: 'already_submitted', message: 'Round 1 result already recorded. Duplicate submission blocked.' },
        { status: 409 }
      );
    }

    // 4. Compute marks — enforce 30-mark pass threshold
    const PASS_MARK = 30;
    const TOTAL_EXAM_QUESTIONS = 10;
    const marksObtained = computeMarks(answers ?? {}, TOTAL_EXAM_QUESTIONS);
    const passed = marksObtained >= PASS_MARK;
    const now = new Date().toISOString();

    // 5. Atomically update exam_schedules status to completed
    const { error: updateScheduleError } = await adminClient
      .from('exam_schedules')
      .update({
        status: 'completed',
        updated_at: now,
      })
      .eq('id', schedule.id)
      .eq('status', 'scheduled'); // Only update if still in 'scheduled' state — prevents race conditions

    if (updateScheduleError) {
      return NextResponse.json({ error: 'Failed to lock exam: ' + updateScheduleError.message }, { status: 500 });
    }

    // 6. Upsert round 1 result — store answers for HR review
    const answersToStore = answers ?? {};

    if (existingRound1) {
      // Update existing round 1 row
      const { error: roundUpdateError } = await adminClient
        .from('exam_round_results')
        .update({
          marks_obtained: marksObtained,
          status: passed ? 'passed' : 'failed',
          submitted_at: now,
          updated_at: now,
          answers: answersToStore,
        })
        .eq('schedule_id', schedule.id)
        .eq('round_number', 1);

      if (roundUpdateError) {
        return NextResponse.json({ error: 'Failed to save round result: ' + roundUpdateError.message }, { status: 500 });
      }
    } else {
      // Insert new round 1 row
      const { error: insertError } = await adminClient
        .from('exam_round_results')
        .insert({
          schedule_id: schedule.id,
          candidate_id: schedule.candidate_id,
          candidate_name: schedule.candidate_name,
          candidate_email: schedule.candidate_email,
          job_role: schedule.job_role ?? 'General',
          round_number: 1,
          round_name: 'Communication Test',
          marks_obtained: marksObtained,
          total_marks: 100,
          pass_mark: PASS_MARK,
          status: passed ? 'passed' : 'failed',
          submitted_at: now,
          answers: answersToStore,
        });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to insert round result: ' + insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      marks_obtained: marksObtained,
      passed,
      pass_mark: PASS_MARK,
      schedule_id: schedule.id,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 });
  }
}

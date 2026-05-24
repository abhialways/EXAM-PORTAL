import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const PASS_MARK = 30;
const VALID_ROUNDS = [1, 2, 3];
const MAX_MARKS = 100;

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { schedule_id, round_number, marks_obtained } = body;

    // --- Input validation ---
    if (!schedule_id || typeof schedule_id !== 'string' || schedule_id.trim() === '') {
      return NextResponse.json({ error: 'schedule_id is required and must be a non-empty string' }, { status: 400 });
    }

    if (round_number === undefined || round_number === null) {
      return NextResponse.json({ error: 'round_number is required' }, { status: 400 });
    }

    const roundNum = Number(round_number);
    if (!Number.isInteger(roundNum) || !VALID_ROUNDS.includes(roundNum)) {
      return NextResponse.json(
        { error: `round_number must be one of: ${VALID_ROUNDS.join(', ')}` },
        { status: 400 }
      );
    }

    if (marks_obtained === undefined || marks_obtained === null) {
      return NextResponse.json({ error: 'marks_obtained is required' }, { status: 400 });
    }

    const marks = Number(marks_obtained);
    if (isNaN(marks) || !isFinite(marks)) {
      return NextResponse.json({ error: 'marks_obtained must be a valid number' }, { status: 400 });
    }

    // Enforce marks range: 0 to MAX_MARKS
    if (marks < 0 || marks > MAX_MARKS) {
      return NextResponse.json(
        { error: `marks_obtained must be between 0 and ${MAX_MARKS}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify the schedule exists
    const { data: schedule, error: scheduleError } = await adminClient
      .from('exam_schedules')
      .select('id, status')
      .eq('id', schedule_id.trim())
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Exam schedule not found' }, { status: 404 });
    }

    // Check if this round already has a submitted result (duplicate guard)
    const { data: existingResult } = await adminClient
      .from('exam_round_results')
      .select('id, submitted_at, status, marks_obtained')
      .eq('schedule_id', schedule_id.trim())
      .eq('round_number', roundNum)
      .single();

    if (existingResult?.submitted_at) {
      return NextResponse.json(
        {
          error: 'duplicate_submission',
          message: `Round ${roundNum} result has already been submitted. Duplicate entry blocked.`,
          existing: {
            marks_obtained: existingResult.marks_obtained,
            status: existingResult.status,
          },
        },
        { status: 409 }
      );
    }

    // Apply 30-mark pass threshold (server-side enforcement)
    const passed = marks >= PASS_MARK;
    const now = new Date().toISOString();

    const { error } = await adminClient
      .from('exam_round_results')
      .update({
        marks_obtained: marks,
        status: passed ? 'passed' : 'failed',
        submitted_at: now,
        updated_at: now,
      })
      .eq('schedule_id', schedule_id.trim())
      .eq('round_number', roundNum);

    if (error) {
      return NextResponse.json({ error: 'Failed to save round result: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      passed,
      marks_obtained: marks,
      pass_mark: PASS_MARK,
      round_number: roundNum,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 });
  }
}

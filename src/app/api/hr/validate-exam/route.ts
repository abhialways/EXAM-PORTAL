import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { round_result_id, verdict, hr_notes } = body;

    if (!round_result_id || typeof round_result_id !== 'string') {
      return NextResponse.json({ error: 'round_result_id is required' }, { status: 400 });
    }

    if (!verdict || !['passed', 'failed'].includes(verdict)) {
      return NextResponse.json({ error: 'verdict must be "passed" or "failed"' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await adminClient
      .from('exam_round_results')
      .update({
        status: verdict as 'passed' | 'failed',
        hr_validated: true,
        hr_verdict: verdict,
        hr_validated_at: now,
        hr_notes: hr_notes ?? null,
        updated_at: now,
      })
      .eq('id', round_result_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update validation: ' + error.message }, { status: 500 });
    }

    // Fetch the round result to get candidate details for the email
    const { data: roundResult, error: fetchError } = await adminClient
      .from('exam_round_results')
      .select('schedule_id, candidate_id, candidate_name, candidate_email, job_role')
      .eq('id', round_result_id)
      .single();

    if (!fetchError && roundResult) {
      // Fire-and-forget: send result email automatically after HR validation
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
      fetch(`${baseUrl}/api/hr/send-result-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: roundResult.schedule_id,
          candidate_email: roundResult.candidate_email,
          candidate_name: roundResult.candidate_name,
          candidate_id: roundResult.candidate_id,
          job_role: roundResult.job_role,
        }),
      }).catch(() => {
        // Non-blocking — email failure should not fail the validation response
      });
    }

    return NextResponse.json({ success: true, verdict, emailTriggered: !fetchError }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 });
  }
}

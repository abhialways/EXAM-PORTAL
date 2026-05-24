import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface RoundResult {
  round_number: number;
  round_name: string;
  marks_obtained: number;
  total_marks: number;
  pass_mark: number;
  status: string;
}

function buildEmailHtml(
  candidate_name: string,
  job_role: string,
  rounds: RoundResult[],
  overall_result: 'Pass' | 'Fail' | 'In Progress'
): string {
  const resultColor = overall_result === 'Pass' ? '#16a34a' : overall_result === 'Fail' ? '#dc2626' : '#d97706';

  const roundRows = rounds
    .filter((r) => r.status === 'passed' || r.status === 'failed')
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Round ${r.round_number} — ${r.round_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${r.marks_obtained}/${r.total_marks}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${r.pass_mark}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${r.status === 'passed' ? '#16a34a' : '#dc2626'};font-weight:600;">${r.status === 'passed' ? 'Pass' : 'Fail'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1e3a5f;padding:32px 40px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">Exam Result Notification</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#374151;font-size:16px;">Dear <strong>${candidate_name}</strong>,</p>
      <p style="color:#374151;font-size:15px;">Thank you for completing the assessment for the <strong>${job_role}</strong> position. Here is a summary of your performance:</p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:600;">Round</th>
            <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;">Score</th>
            <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;">Pass Mark</th>
            <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;">Result</th>
          </tr>
        </thead>
        <tbody>${roundRows}</tbody>
      </table>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;text-align:center;margin-top:24px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Overall Result</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:${resultColor};">${overall_result}</p>
      </div>

      <p style="color:#6b7280;font-size:13px;margin-top:32px;">If you have any questions, please contact our HR team.</p>
    </div>
    <div style="background:#f3f4f6;padding:16px 40px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Exam Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { schedule_id, candidate_email, candidate_name, candidate_id, job_role } = await request.json();

    if (!schedule_id || !candidate_email || !candidate_name || !candidate_id || !job_role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
    }

    const adminClient = createAdminClient();

    // Fetch round results
    const { data: rounds, error: roundsError } = await adminClient
      .from('exam_round_results')
      .select('round_number, round_name, marks_obtained, total_marks, pass_mark, status')
      .eq('schedule_id', schedule_id)
      .order('round_number', { ascending: true });

    if (roundsError) {
      return NextResponse.json({ error: roundsError.message }, { status: 500 });
    }

    const completedRounds = (rounds ?? []).filter(
      (r: RoundResult) => r.status === 'passed' || r.status === 'failed'
    );
    const allPassed = completedRounds.length === 3 && completedRounds.every((r: RoundResult) => r.status === 'passed');
    const anyFailed = completedRounds.some((r: RoundResult) => r.status === 'failed');
    const overallResult: 'Pass' | 'Fail' | 'In Progress' = allPassed ? 'Pass' : anyFailed ? 'Fail' : 'In Progress';

    const htmlContent = buildEmailHtml(candidate_name, job_role, rounds ?? [], overallResult);

    // Call Resend REST API directly — no SDK
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Exam Portal <onboarding@resend.dev>',
        to: [candidate_email],
        subject: `Your Exam Result — ${job_role}`,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendResponse.status, resendData);
      await adminClient
        .from('exam_round_results')
        .update({ notification_status: 'failed' })
        .eq('schedule_id', schedule_id);
      return NextResponse.json(
        { error: 'Email send failed', details: resendData, status: resendResponse.status },
        { status: 502 }
      );
    }

    // Mark rounds as notified
    await adminClient
      .from('exam_round_results')
      .update({ notification_status: 'sent', notification_sent_at: new Date().toISOString() })
      .eq('schedule_id', schedule_id);

    return NextResponse.json({ success: true, overallResult, emailId: (resendData as any).id }, { status: 200 });
  } catch (err: any) {
    console.error('send-result-email unexpected error:', err);
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 });
  }
}

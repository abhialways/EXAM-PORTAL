import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidate_id');

    if (!candidateId) {
      return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: schedule, error } = await adminClient
      .from('exam_schedules')
      .select('id, status')
      .eq('candidate_id', candidateId)
      .single();

    if (error || !schedule) {
      return NextResponse.json({ status: 'not_found' }, { status: 200 });
    }

    return NextResponse.json({ status: schedule.status }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

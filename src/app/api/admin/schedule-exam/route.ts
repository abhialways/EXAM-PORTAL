import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin client using service role key — bypasses RLS entirely
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const VALID_JOB_ROLES = ['Data Analyst', 'Accountant', 'Core Technical', 'Other'];

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      candidate_email,
      candidate_name,
      candidate_contact,
      exam_name,
      subject,
      exam_date,
      start_time,
      end_time,
      candidate_id,
      candidate_password,
      status,
      job_role,
    } = body;

    // --- Required field validation ---
    const missingFields: string[] = [];
    if (!candidate_email) missingFields.push('candidate_email');
    if (!candidate_name) missingFields.push('candidate_name');
    if (!candidate_contact) missingFields.push('candidate_contact');
    if (!exam_name) missingFields.push('exam_name');
    if (!subject) missingFields.push('subject');
    if (!exam_date) missingFields.push('exam_date');
    if (!start_time) missingFields.push('start_time');
    if (!end_time) missingFields.push('end_time');
    if (!candidate_id) missingFields.push('candidate_id');
    if (!candidate_password) missingFields.push('candidate_password');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // --- Format validation ---
    if (!EMAIL_REGEX.test(candidate_email.trim())) {
      return NextResponse.json({ error: 'candidate_email is not a valid email address' }, { status: 400 });
    }

    if (typeof candidate_name !== 'string' || candidate_name.trim().length < 2) {
      return NextResponse.json({ error: 'candidate_name must be at least 2 characters' }, { status: 400 });
    }

    if (typeof candidate_contact !== 'string' || !/^\+?[\d\s\-()]{7,15}$/.test(candidate_contact.trim())) {
      return NextResponse.json({ error: 'candidate_contact must be a valid phone number' }, { status: 400 });
    }

    if (typeof candidate_id !== 'string' || candidate_id.trim().length < 3) {
      return NextResponse.json({ error: 'candidate_id must be at least 3 characters' }, { status: 400 });
    }

    if (typeof candidate_password !== 'string' || candidate_password.trim().length < 4) {
      return NextResponse.json({ error: 'candidate_password must be at least 4 characters' }, { status: 400 });
    }

    if (!DATE_REGEX.test(exam_date)) {
      return NextResponse.json({ error: 'exam_date must be in YYYY-MM-DD format' }, { status: 400 });
    }

    if (!TIME_REGEX.test(start_time)) {
      return NextResponse.json({ error: 'start_time must be in HH:MM or HH:MM:SS format' }, { status: 400 });
    }

    if (!TIME_REGEX.test(end_time)) {
      return NextResponse.json({ error: 'end_time must be in HH:MM or HH:MM:SS format' }, { status: 400 });
    }

    // Ensure end_time is after start_time
    if (start_time >= end_time) {
      return NextResponse.json({ error: 'end_time must be after start_time' }, { status: 400 });
    }

    if (job_role && !VALID_JOB_ROLES.includes(job_role)) {
      return NextResponse.json(
        { error: `job_role must be one of: ${VALID_JOB_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // --- Duplicate checks before insert ---
    // Check duplicate candidate_id
    const { data: existingById } = await adminClient
      .from('exam_schedules')
      .select('id, candidate_id')
      .eq('candidate_id', candidate_id.trim())
      .maybeSingle();

    if (existingById) {
      return NextResponse.json(
        { error: 'duplicate', message: `Candidate ID "${candidate_id}" is already scheduled for an exam.` },
        { status: 409 }
      );
    }

    // Check duplicate candidate_email (only for active/scheduled exams)
    const { data: existingByEmail } = await adminClient
      .from('exam_schedules')
      .select('id, candidate_email, status')
      .eq('candidate_email', candidate_email.trim().toLowerCase())
      .in('status', ['scheduled', 'in_progress'])
      .maybeSingle();

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'duplicate', message: `An active exam is already scheduled for email "${candidate_email}".` },
        { status: 409 }
      );
    }

    // --- Insert ---
    const { data: scheduleData, error } = await adminClient
      .from('exam_schedules')
      .insert({
        candidate_email: candidate_email.trim().toLowerCase(),
        candidate_name: candidate_name.trim(),
        candidate_contact: candidate_contact.trim(),
        exam_name: exam_name.trim(),
        subject: subject.trim(),
        exam_date,
        start_time,
        end_time,
        candidate_id: candidate_id.trim(),
        candidate_password: candidate_password.trim(),
        status: status ?? 'scheduled',
        job_role: job_role ?? null,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'duplicate', message: 'A schedule with this candidate ID already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-initialize 3 round result rows if job_role is provided
    if (job_role && scheduleData?.id) {
      await adminClient.rpc('initialize_exam_rounds', {
        p_schedule_id: scheduleData.id,
        p_candidate_id: candidate_id.trim(),
        p_candidate_name: candidate_name.trim(),
        p_candidate_email: candidate_email.trim().toLowerCase(),
        p_job_role: job_role,
      });

      // Also update candidate_contact in the newly created round rows
      await adminClient
        .from('exam_round_results')
        .update({ candidate_contact: candidate_contact.trim() })
        .eq('schedule_id', scheduleData.id);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unexpected server error' }, { status: 500 });
  }
}

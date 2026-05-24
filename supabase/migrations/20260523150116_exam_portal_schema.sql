-- Exam Portal Schema Migration
-- Tables: user_profiles, exam_schedules, candidates

-- 1. Types
DROP TYPE IF EXISTS public.portal_role CASCADE;
CREATE TYPE public.portal_role AS ENUM ('admin', 'hr', 'candidate');

DROP TYPE IF EXISTS public.exam_subject CASCADE;
CREATE TYPE public.exam_subject AS ENUM ('Communication Test', 'Excel Test', 'Data Analyst', 'Accountant', 'Core Technical');

DROP TYPE IF EXISTS public.schedule_status CASCADE;
CREATE TYPE public.schedule_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.portal_role DEFAULT 'candidate'::public.portal_role,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email TEXT NOT NULL,
  candidate_name TEXT NOT NULL DEFAULT '',
  exam_name TEXT NOT NULL,
  subject public.exam_subject NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  candidate_id TEXT NOT NULL UNIQUE,
  candidate_password TEXT NOT NULL,
  status public.schedule_status DEFAULT 'scheduled'::public.schedule_status,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_candidate_email ON public.exam_schedules(candidate_email);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_date ON public.exam_schedules(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_created_by ON public.exam_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_candidate_id ON public.exam_schedules(candidate_id);

-- 4. Functions (BEFORE RLS policies)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')::public.portal_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles up
  WHERE up.id = auth.uid() AND up.role IN ('admin', 'hr')
)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles up
  WHERE up.id = auth.uid() AND up.role = 'admin'
)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_hr_view_all_profiles" ON public.user_profiles;
CREATE POLICY "admin_hr_view_all_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_hr());

DROP POLICY IF EXISTS "admin_manage_schedules" ON public.exam_schedules;
CREATE POLICY "admin_manage_schedules"
ON public.exam_schedules
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "hr_view_schedules" ON public.exam_schedules;
CREATE POLICY "hr_view_schedules"
ON public.exam_schedules
FOR SELECT
TO authenticated
USING (public.is_admin_or_hr());

-- 7. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_exam_schedules_updated_at ON public.exam_schedules;
CREATE TRIGGER update_exam_schedules_updated_at
  BEFORE UPDATE ON public.exam_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Seed admin and HR users
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  hr_uuid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@examportal.in', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'Portal Admin', 'role', 'admin'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
    (hr_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'hr.manager@examportal.in', crypt('HR@secure2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'HR Manager', 'role', 'hr'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed users already exist or error: %', SQLERRM;
END $$;

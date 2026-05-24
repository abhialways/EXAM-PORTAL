-- Fix Authentication Issues
-- 1. Add anon SELECT policy on exam_schedules so candidates can log in without Supabase auth
-- 2. Re-seed admin/HR users using ON CONFLICT (email) to handle existing records
-- 3. Ensure user_profiles have correct roles for admin/HR

-- ============================================================
-- 1. Allow anonymous reads on exam_schedules (candidate login)
-- ============================================================
DROP POLICY IF EXISTS "anon_candidate_login_lookup" ON public.exam_schedules;
CREATE POLICY "anon_candidate_login_lookup"
ON public.exam_schedules
FOR SELECT
TO anon
USING (true);

-- ============================================================
-- 2. Re-seed admin and HR users (idempotent via email conflict)
-- ============================================================
DO $$
DECLARE
  admin_uuid UUID;
  hr_uuid UUID;
BEGIN
  -- Check if admin already exists in auth.users
  SELECT id INTO admin_uuid FROM auth.users WHERE email = 'admin@examportal.in' LIMIT 1;
  IF admin_uuid IS NULL THEN
    admin_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@examportal.in', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Portal Admin', 'role', 'admin'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );
    RAISE NOTICE 'Admin user created with id: %', admin_uuid;
  ELSE
    -- Update password in case it changed
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@2026', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = admin_uuid;
    RAISE NOTICE 'Admin user already exists, password refreshed: %', admin_uuid;
  END IF;

  -- Ensure admin profile exists with correct role
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (admin_uuid, 'admin@examportal.in', 'Portal Admin', 'admin'::public.portal_role)
  ON CONFLICT (id) DO UPDATE SET role = 'admin'::public.portal_role, email = 'admin@examportal.in';

  -- Check if HR already exists in auth.users
  SELECT id INTO hr_uuid FROM auth.users WHERE email = 'hr.manager@examportal.in' LIMIT 1;
  IF hr_uuid IS NULL THEN
    hr_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      hr_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'hr.manager@examportal.in', crypt('HR@secure2026', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'HR Manager', 'role', 'hr'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );
    RAISE NOTICE 'HR user created with id: %', hr_uuid;
  ELSE
    -- Update password in case it changed
    UPDATE auth.users
    SET encrypted_password = crypt('HR@secure2026', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = hr_uuid;
    RAISE NOTICE 'HR user already exists, password refreshed: %', hr_uuid;
  END IF;

  -- Ensure HR profile exists with correct role
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (hr_uuid, 'hr.manager@examportal.in', 'HR Manager', 'hr'::public.portal_role)
  ON CONFLICT (id) DO UPDATE SET role = 'hr'::public.portal_role, email = 'hr.manager@examportal.in';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed error: %', SQLERRM;
END $$;

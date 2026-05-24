-- Fix: Insert missing auth.identities rows (required for signInWithPassword)
-- Root cause: auth.users had 2 rows but auth.identities had 0 rows.
-- Supabase signInWithPassword requires a matching identity record.

DO $$
DECLARE
  admin_id UUID;
  hr_id UUID;
BEGIN
  -- Get existing user IDs
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@examportal.in' LIMIT 1;
  SELECT id INTO hr_id FROM auth.users WHERE email = 'hr.manager@examportal.in' LIMIT 1;

  -- Refresh admin password
  IF admin_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt('Admin@2026', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[])
    WHERE id = admin_id;

    -- Insert identity record for admin (required for signInWithPassword)
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_id,
      'admin@examportal.in',
      'email',
      jsonb_build_object('sub', admin_id::TEXT, 'email', 'admin@examportal.in', 'email_verified', true),
      now(), now(), now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE
      SET identity_data = jsonb_build_object('sub', admin_id::TEXT, 'email', 'admin@examportal.in', 'email_verified', true),
          updated_at = now();

    RAISE NOTICE 'Admin identity fixed for id: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found, skipping';
  END IF;

  -- Refresh HR password
  IF hr_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt('HR@secure2026', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[])
    WHERE id = hr_id;

    -- Insert identity record for HR (required for signInWithPassword)
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      hr_id,
      'hr.manager@examportal.in',
      'email',
      jsonb_build_object('sub', hr_id::TEXT, 'email', 'hr.manager@examportal.in', 'email_verified', true),
      now(), now(), now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE
      SET identity_data = jsonb_build_object('sub', hr_id::TEXT, 'email', 'hr.manager@examportal.in', 'email_verified', true),
          updated_at = now();

    RAISE NOTICE 'HR identity fixed for id: %', hr_id;
  ELSE
    RAISE NOTICE 'HR user not found, skipping';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Identity fix error: %', SQLERRM;
END $$;

-- Fix user_profiles RLS: allow admin/hr to read their own profile
-- The existing policy "users_manage_own_user_profiles" already covers this (id = auth.uid())
-- But "admin_hr_view_all_profiles" uses is_admin_or_hr() which queries user_profiles (potential recursion)
-- Replace with a safe auth.users metadata-based function

CREATE OR REPLACE FUNCTION public.is_admin_or_hr_from_meta()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (
    au.raw_user_meta_data->>'role' IN ('admin', 'hr')
    OR au.raw_app_meta_data->>'role' IN ('admin', 'hr')
  )
)
$$;

-- Drop old potentially recursive policy and replace with safe version
DROP POLICY IF EXISTS "admin_hr_view_all_profiles" ON public.user_profiles;
CREATE POLICY "admin_hr_view_all_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_hr_from_meta());

-- Also ensure anon can still look up exam_schedules for candidate login
DROP POLICY IF EXISTS "anon_candidate_login_lookup" ON public.exam_schedules;
CREATE POLICY "anon_candidate_login_lookup"
ON public.exam_schedules
FOR SELECT
TO anon
USING (true);

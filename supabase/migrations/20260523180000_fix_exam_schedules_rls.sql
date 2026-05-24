-- Fix: admin_manage_schedules RLS policy blocked INSERT
-- Root cause: is_admin() queries user_profiles, but admin's user_profiles row
-- may not exist (seed used ON CONFLICT DO NOTHING, trigger may not have fired).
-- Fix: replace is_admin() with metadata-based check on auth.users (no user_profiles dependency).

-- Create a safe is_admin function that reads from auth.users metadata
CREATE OR REPLACE FUNCTION public.is_admin_from_meta()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (
    au.raw_user_meta_data->>'role' = 'admin'
    OR au.raw_app_meta_data->>'role' = 'admin'
  )
)
$$;

-- Replace the admin_manage_schedules policy with the safe metadata-based version
DROP POLICY IF EXISTS "admin_manage_schedules" ON public.exam_schedules;
CREATE POLICY "admin_manage_schedules"
ON public.exam_schedules
FOR ALL
TO authenticated
USING (public.is_admin_from_meta())
WITH CHECK (public.is_admin_from_meta());

-- Also update hr_view_schedules to use the already-existing safe function
DROP POLICY IF EXISTS "hr_view_schedules" ON public.exam_schedules;
CREATE POLICY "hr_view_schedules"
ON public.exam_schedules
FOR SELECT
TO authenticated
USING (public.is_admin_or_hr_from_meta());

-- Ensure admin's user_profiles row exists (in case trigger didn't fire during seed)
DO $$
DECLARE
  admin_id UUID;
  hr_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@examportal.in' LIMIT 1;
  SELECT id INTO hr_id FROM auth.users WHERE email = 'hr.manager@examportal.in' LIMIT 1;

  IF admin_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@examportal.in', 'Portal Admin', 'admin'::public.portal_role)
    ON CONFLICT (id) DO UPDATE SET role = 'admin'::public.portal_role, updated_at = now();
  END IF;

  IF hr_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (hr_id, 'hr.manager@examportal.in', 'HR Manager', 'hr'::public.portal_role)
    ON CONFLICT (id) DO UPDATE SET role = 'hr'::public.portal_role, updated_at = now();
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'user_profiles upsert error: %', SQLERRM;
END $$;

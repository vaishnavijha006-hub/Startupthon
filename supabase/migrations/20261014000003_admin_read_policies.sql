-- =============================================================================
-- Migration: 20261014000003_admin_read_policies.sql
-- Description: Configures Row Level Security (RLS) SELECT policies on
--              public.registrations, public.participants, and public.startup_ideas
--              exclusively for authenticated administrators.
--
-- SECURITY PRINCIPLES:
-- 1. Row Level Security (RLS) remains enabled on all application tables.
-- 2. No public (anon) read policies are created. Student contact information
--    (emails, phones, roll numbers) remains completely inaccessible to the public.
-- 3. SELECT permissions are granted only to authenticated accounts possessing the
--    server-controlled claim app_metadata.role = 'admin' or app_metadata.is_admin = true.
-- =============================================================================

-- 1. Ensure RLS is active
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_ideas ENABLE ROW LEVEL SECURITY;

-- 2. Drop any prior existing admin select policies safely
DROP POLICY IF EXISTS "Admins can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view participants" ON public.participants;
DROP POLICY IF EXISTS "Admins can view startup ideas" ON public.startup_ideas;

-- 3. Define admin-only SELECT policies
CREATE POLICY "Admins can view registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
);

CREATE POLICY "Admins can view participants"
ON public.participants
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
);

CREATE POLICY "Admins can view startup ideas"
ON public.startup_ideas
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
);

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

BEGIN;

-- 1. Ensure RLS is active
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_ideas ENABLE ROW LEVEL SECURITY;

-- 2. Drop any prior existing admin select policies safely
DROP POLICY IF EXISTS "Admins can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view participants" ON public.participants;
DROP POLICY IF EXISTS "Admins can view startup ideas" ON public.startup_ideas;

-- 3. Define admin-only SELECT policies
-- Uses string and jsonb matching instead of ::boolean cast to avoid syntax errors on malformed claims
CREATE POLICY "Admins can view registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
  OR (auth.jwt() -> 'app_metadata' -> 'is_admin') = 'true'::jsonb
);

CREATE POLICY "Admins can view participants"
ON public.participants
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
  OR (auth.jwt() -> 'app_metadata' -> 'is_admin') = 'true'::jsonb
);

CREATE POLICY "Admins can view startup ideas"
ON public.startup_ideas
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
  OR (auth.jwt() -> 'app_metadata' -> 'is_admin') = 'true'::jsonb
);

-- 4. Defense-in-depth table-level grants:
-- Revoke all direct permissions from anon (unauthenticated public)
REVOKE ALL ON public.registrations FROM anon;
REVOKE ALL ON public.participants FROM anon;
REVOKE ALL ON public.startup_ideas FROM anon;

-- Revoke direct mutation permissions from authenticated users (inserts go through RPC)
REVOKE INSERT, UPDATE, DELETE ON public.registrations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.participants FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.startup_ideas FROM authenticated;

-- Explicitly ensure SELECT is granted to authenticated (required by Admin Dashboard RLS)
GRANT SELECT ON public.registrations TO authenticated;
GRANT SELECT ON public.participants TO authenticated;
GRANT SELECT ON public.startup_ideas TO authenticated;

COMMIT;

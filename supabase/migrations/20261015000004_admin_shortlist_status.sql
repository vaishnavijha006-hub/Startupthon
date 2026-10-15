-- Adds the persistent decision field used by the admin dashboard.
-- Run after 20261014000003_admin_read_policies.sql.
BEGIN;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS shortlist_status TEXT NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'registrations_shortlist_status_check'
      AND conrelid = 'public.registrations'::regclass
  ) THEN
    ALTER TABLE public.registrations
      ADD CONSTRAINT registrations_shortlist_status_check
      CHECK (shortlist_status IN ('pending', 'shortlisted', 'rejected'));
  END IF;
END;
$$;

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update shortlist status" ON public.registrations;
CREATE POLICY "Admins can update shortlist status"
ON public.registrations
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
  OR (auth.jwt() -> 'app_metadata' -> 'is_admin') = 'true'::jsonb
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
  OR (auth.jwt() -> 'app_metadata' -> 'is_admin') = 'true'::jsonb
);

-- Authenticated users may change only the shortlist column; RLS limits rows to admins.
REVOKE UPDATE ON public.registrations FROM PUBLIC, anon, authenticated;
GRANT UPDATE (shortlist_status) ON public.registrations TO authenticated;

COMMIT;

-- Private storage for sketches uploaded through the submit-registration Edge Function.
-- Uploads use the server-only service role; authenticated administrators receive
-- short-lived signed URLs through the admin dashboard.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registration-sketches',
  'registration-sketches',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can read registration sketches" ON storage.objects;
GRANT SELECT ON storage.objects TO authenticated;
CREATE POLICY "Admins can read registration sketches"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'registration-sketches'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
    OR (auth.jwt() -> 'app_metadata' -> 'is_admin') = 'true'::jsonb
  )
);

COMMIT;

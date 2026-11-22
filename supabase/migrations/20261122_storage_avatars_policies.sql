-- P0: avatars bucket — public read, no member write.
-- App uploads use SUPABASE_SERVICE_ROLE_KEY (src/lib/actions/avatar.ts,
-- src/lib/actions/project.ts). service_role bypasses Storage RLS.
--
-- storage.objects is owned by supabase_storage_admin. This migration
-- applies when the runner can DDL it (CLI / local). If it no-ops, apply
-- the same policies in Dashboard → Storage → avatars → Policies:
--   1. SELECT, public, USING (bucket_id = 'avatars')
--   2. No INSERT / UPDATE / DELETE policies for anon or authenticated
--   3. Confirm the bucket is public (read URLs used on profiles/projects)

DO $$
DECLARE
  policy record;
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage.objects missing; skip avatars policies';
    RETURN;
  END IF;

  FOR policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        COALESCE(qual, '') ILIKE '%avatars%'
        OR COALESCE(with_check, '') ILIKE '%avatars%'
        OR policyname ILIKE '%avatar%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy.policyname);
  END LOOP;

  EXECUTE $sql$
    CREATE POLICY "avatars_public_read"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars')
  $sql$;

  RAISE NOTICE 'avatars storage policies: public SELECT only';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot DDL storage.objects (need Dashboard policies): public SELECT on bucket avatars, no member writes';
  WHEN OTHERS THEN
    RAISE NOTICE 'avatars storage policy apply skipped: %', SQLERRM;
END $$;

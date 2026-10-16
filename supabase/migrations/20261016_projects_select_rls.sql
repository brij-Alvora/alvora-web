-- Replace live projects SELECT policies. Draft/archived are owner-only.
-- Admins continue to use the service_role client (bypasses RLS).

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy record;
BEGIN
  FOR policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'projects'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.projects',
      policy.policyname
    );
  END LOOP;
END $$;

CREATE POLICY "Published projects are publicly readable"
  ON public.projects
  FOR SELECT
  USING (status = 'published' OR auth.uid() = owner_id);

CREATE POLICY "Owners can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

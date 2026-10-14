-- Sprint 3: RLS for existing public.validation_requests
-- Does NOT recreate the table or drop columns.

ALTER TABLE public.validation_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.validation_requests DROP CONSTRAINT IF EXISTS validation_requests_status_check;
ALTER TABLE public.validation_requests
  ADD CONSTRAINT validation_requests_status_check
  CHECK (status IN ('open', 'in_review', 'completed'));

DROP POLICY IF EXISTS "Users can read own validation requests" ON public.validation_requests;
CREATE POLICY "Users can read own validation requests"
  ON public.validation_requests
  FOR SELECT
  USING (
    auth.uid() = requested_by
    OR project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create validation requests" ON public.validation_requests;
CREATE POLICY "Users can create validation requests"
  ON public.validation_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "Users can update validation request status" ON public.validation_requests;
CREATE POLICY "Users can update validation request status"
  ON public.validation_requests
  FOR UPDATE
  USING (
    auth.uid() = requested_by
    OR project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = requested_by
    OR project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

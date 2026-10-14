-- Sprint 4: upgrade existing public.reviews
-- Does NOT drop the table or existing columns
-- (id, project_id, reviewer_id, rating, review_text, created_at stay).

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS validation_request_id uuid,
  ADD COLUMN IF NOT EXISTS what_works_well text,
  ADD COLUMN IF NOT EXISTS improvement_areas text,
  ADD COLUMN IF NOT EXISTS recommendations text;

CREATE INDEX IF NOT EXISTS reviews_validation_request_id_idx
  ON public.reviews (validation_request_id);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_request_reviewer_key
  ON public.reviews (validation_request_id, reviewer_id)
  WHERE validation_request_id IS NOT NULL;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read reviews" ON public.reviews;
CREATE POLICY "Authenticated users can read reviews"
  ON public.reviews
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can read own validation requests" ON public.validation_requests;
DROP POLICY IF EXISTS "Authenticated users can read validation requests" ON public.validation_requests;
CREATE POLICY "Authenticated users can read validation requests"
  ON public.validation_requests
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

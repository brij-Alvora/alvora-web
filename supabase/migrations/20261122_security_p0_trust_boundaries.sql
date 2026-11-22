-- P0 trust boundaries. ALTER-only. Does not drop tables or columns.
-- Locks validation_requests read/insert, review inserts (no orphans,
-- request must match project, published only), and projects.validation_score.

-- ---------------------------------------------------------------------------
-- validation_requests SELECT: requester, owner, or published-project queue
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read validation requests"
  ON public.validation_requests;
DROP POLICY IF EXISTS "Users can read own validation requests"
  ON public.validation_requests;
DROP POLICY IF EXISTS "Members can read own or published-project validation requests"
  ON public.validation_requests;

CREATE POLICY "Members can read own or published-project validation requests"
  ON public.validation_requests
  FOR SELECT
  USING (
    auth.uid() = requested_by
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.status = 'published'
    )
  );

-- ---------------------------------------------------------------------------
-- validation_requests INSERT: own project + requested_by = caller
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create validation requests"
  ON public.validation_requests;
DROP POLICY IF EXISTS "Owners can create validation requests for own projects"
  ON public.validation_requests;

CREATE POLICY "Owners can create validation requests for own projects"
  ON public.validation_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- reviews INSERT: named request on this published project, not an orphan
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;

CREATE POLICY "Users can insert their own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND validation_request_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.validation_requests vr
      WHERE vr.id = validation_request_id
        AND vr.project_id = project_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.status = 'published'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.validation_requests vr
      WHERE vr.id = validation_request_id
        AND vr.requested_by = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_review_request_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF NEW.validation_request_id IS NULL THEN
    RAISE EXCEPTION 'Reviews must belong to a validation request'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.validation_requests vr
    WHERE vr.id = NEW.validation_request_id
      AND vr.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Review must target the validation request project'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = NEW.project_id
      AND p.status = 'published'
  ) THEN
    RAISE EXCEPTION 'Reviews are only allowed on published projects'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_request_integrity ON public.reviews;
CREATE TRIGGER trg_enforce_review_request_integrity
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_review_request_integrity();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.reviews
    WHERE validation_request_id IS NULL
  ) THEN
    ALTER TABLE public.reviews
      ALTER COLUMN validation_request_id SET NOT NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- projects.validation_score: members cannot modify
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_project_validation_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.validation_score := 0;
    RETURN NEW;
  END IF;

  NEW.validation_score := OLD.validation_score;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_project_validation_score ON public.projects;
CREATE TRIGGER trg_protect_project_validation_score
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_project_validation_score();

DO $$
BEGIN
  BEGIN
    REVOKE UPDATE ON TABLE public.projects FROM anon;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    REVOKE UPDATE ON TABLE public.projects FROM authenticated;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  GRANT UPDATE (
    title,
    slug,
    short_description,
    description,
    category,
    tags,
    github_url,
    demo_url,
    thumbnail_url,
    status,
    published_at,
    updated_at
  ) ON TABLE public.projects TO authenticated;
END $$;

-- Phase 2A security hardening. ALTER-only. Run in the Supabase SQL editor.
-- Locks profile privileges, independent-review completion, owner-review block,
-- hidden-review SELECT, and a 15-minute review edit window.

-- ---------------------------------------------------------------------------
-- Actor detection: JWT service_role may change privileges. SQL editor (no JWT)
-- as postgres/supabase_admin may too. Member JWTs cannot.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  jwt_role text;
  jwt_claims text;
BEGIN
  BEGIN
    jwt_role := COALESCE(auth.role(), '');
  EXCEPTION WHEN OTHERS THEN
    jwt_role := '';
  END;

  IF jwt_role = 'service_role' THEN
    RETURN true;
  END IF;

  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_claims := NULL;
  END;

  IF (jwt_claims IS NULL OR jwt_claims = '')
     AND session_user IN ('postgres', 'supabase_admin') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO authenticated, service_role, postgres;

-- ---------------------------------------------------------------------------
-- C1: role + account_status (and reputation_score) are service_role only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
    NEW.account_status := 'active';
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.account_status := OLD.account_status;
  NEW.reputation_score := OLD.reputation_score;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileges();

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name)
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN (
      'username', 'full_name', 'headline', 'bio', 'location', 'city', 'country',
      'website', 'github_url', 'linkedin_url', 'avatar_url', 'updated_at'
    );

  BEGIN
    REVOKE UPDATE ON TABLE public.profiles FROM anon;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF cols IS NOT NULL THEN
    EXECUTE format(
      'GRANT UPDATE (%s) ON TABLE public.profiles TO authenticated',
      cols
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Independent visible review (not owner, not requester)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validation_has_independent_review(request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.validation_requests vr ON vr.id = r.validation_request_id
    JOIN public.projects p ON p.id = vr.project_id
    WHERE r.validation_request_id = request_id
      AND r.moderation_status = 'visible'
      AND r.reviewer_id IS DISTINCT FROM vr.requested_by
      AND r.reviewer_id IS DISTINCT FROM p.owner_id
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_validation_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    IF NOT public.validation_has_independent_review(NEW.id) THEN
      RAISE EXCEPTION
        'Validation cannot be completed without an independent visible review'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_validation_completion ON public.validation_requests;
CREATE TRIGGER trg_enforce_validation_completion
  BEFORE INSERT OR UPDATE ON public.validation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_validation_completion();

CREATE OR REPLACE FUNCTION public.reopen_validation_if_unqualified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  request_id uuid;
BEGIN
  request_id := COALESCE(NEW.validation_request_id, OLD.validation_request_id);
  IF request_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.validation_requests
  SET status = 'in_review'
  WHERE id = request_id
    AND status = 'completed'
    AND NOT public.validation_has_independent_review(id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reopen_validation_if_unqualified ON public.reviews;
CREATE TRIGGER trg_reopen_validation_if_unqualified
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.reopen_validation_if_unqualified();

-- ---------------------------------------------------------------------------
-- Owners cannot review their own projects; requesters cannot review own request
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_owner_and_self_reviews()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = NEW.project_id
      AND p.owner_id = NEW.reviewer_id
  ) THEN
    RAISE EXCEPTION 'Project owners cannot review their own projects'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.validation_request_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.validation_requests vr
    WHERE vr.id = NEW.validation_request_id
      AND vr.requested_by = NEW.reviewer_id
  ) THEN
    RAISE EXCEPTION 'You cannot review your own validation request'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_service_role() THEN
    NEW.moderation_status := COALESCE(NEW.moderation_status, 'visible');
    IF NEW.moderation_status IS DISTINCT FROM 'visible' THEN
      NEW.moderation_status := 'visible';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_owner_and_self_reviews ON public.reviews;
CREATE TRIGGER trg_prevent_owner_and_self_reviews
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_and_self_reviews();

-- ---------------------------------------------------------------------------
-- 15-minute edit window; identity and moderation columns locked for members
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_review_immutability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN NEW;
  END IF;

  NEW.reviewer_id := OLD.reviewer_id;
  NEW.project_id := OLD.project_id;
  NEW.validation_request_id := OLD.validation_request_id;
  NEW.moderation_status := OLD.moderation_status;

  IF now() > OLD.created_at + interval '15 minutes' THEN
    RAISE EXCEPTION 'Reviews cannot be edited after the 15-minute window'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_immutability ON public.reviews;
CREATE TRIGGER trg_enforce_review_immutability
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_review_immutability();

-- ---------------------------------------------------------------------------
-- Hidden/flagged reviews are not readable by other authenticated users
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read reviews" ON public.reviews;
CREATE POLICY "Authenticated users can read reviews"
  ON public.reviews
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      moderation_status = 'visible'
      OR reviewer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND NOT EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
    AND (
      validation_request_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.validation_requests vr
        WHERE vr.id = validation_request_id AND vr.requested_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    auth.uid() = reviewer_id
    AND created_at > now() - interval '15 minutes'
    AND moderation_status = 'visible'
  )
  WITH CHECK (
    auth.uid() = reviewer_id
    AND moderation_status = 'visible'
  );

-- ---------------------------------------------------------------------------
-- Auth rate-limit ledger (service_role only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_bucket_created_idx
  ON public.auth_rate_limits (action, bucket, created_at DESC);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_rate_limits FROM anon, authenticated, PUBLIC;

-- Completed validations cannot return to open. Reopen to in_review only
-- when no independent visible review remains.

CREATE OR REPLACE FUNCTION public.protect_validation_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- service_role JWT may override completed status. Members cannot.
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = 'completed'
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'in_review'
       AND NOT public.validation_has_independent_review(NEW.id) THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION
      'Completed validations cannot change status except when independent reviews are removed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_validation_status ON public.validation_requests;
CREATE TRIGGER trg_protect_validation_status
  BEFORE UPDATE ON public.validation_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_validation_status();

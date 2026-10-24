-- Founding Mentor is a profile flag, not a role.
-- Members may edit expertise. Only service_role may set is_founding_mentor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founding_mentor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expertise text[] NOT NULL DEFAULT '{}';

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
    NEW.is_founding_mentor := false;
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.account_status := OLD.account_status;
  NEW.reputation_score := OLD.reputation_score;
  NEW.is_founding_mentor := OLD.is_founding_mentor;
  RETURN NEW;
END;
$$;

GRANT UPDATE (expertise) ON TABLE public.profiles TO authenticated;

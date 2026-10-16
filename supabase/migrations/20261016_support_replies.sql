-- Member replies on support tickets. ALTER-only.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_follow_up text;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_follow_up_at timestamptz;

CREATE OR REPLACE FUNCTION public.protect_support_ticket_member_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN NEW;
  END IF;

  NEW.user_id := OLD.user_id;
  NEW.category := OLD.category;
  NEW.priority := OLD.priority;
  NEW.subject := OLD.subject;
  NEW.message := OLD.message;
  NEW.admin_reply := OLD.admin_reply;
  NEW.assigned_admin_id := OLD.assigned_admin_id;
  NEW.first_response_at := OLD.first_response_at;
  NEW.created_at := OLD.created_at;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('resolved', 'closed') AND NEW.status = 'open' THEN
      NEW.closed_at := NULL;
    ELSE
      NEW.status := OLD.status;
      NEW.closed_at := OLD.closed_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_support_ticket_member_update ON public.support_tickets;
CREATE TRIGGER trg_protect_support_ticket_member_update
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_support_ticket_member_update();

DROP POLICY IF EXISTS "Users can update own support tickets" ON public.support_tickets;
CREATE POLICY "Users can update own support tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  GRANT UPDATE (
    user_follow_up,
    user_follow_up_at,
    status,
    updated_at,
    closed_at
  ) ON TABLE public.support_tickets TO authenticated;
EXCEPTION WHEN OTHERS THEN
  GRANT UPDATE ON TABLE public.support_tickets TO authenticated;
END $$;

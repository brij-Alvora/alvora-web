-- H1–H7 operational polish. ALTER only.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

UPDATE public.support_tickets
SET first_response_at = COALESCE(first_response_at, updated_at, created_at)
WHERE first_response_at IS NULL
  AND admin_reply IS NOT NULL
  AND btrim(admin_reply) <> '';

UPDATE public.support_tickets
SET closed_at = COALESCE(closed_at, updated_at, created_at)
WHERE closed_at IS NULL
  AND status IN ('resolved', 'closed');

CREATE INDEX IF NOT EXISTS support_tickets_assigned_admin_idx
  ON public.support_tickets (assigned_admin_id);

CREATE INDEX IF NOT EXISTS support_tickets_closed_at_idx
  ON public.support_tickets (closed_at);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'review_received',
      'validation_completed',
      'reputation_level_up',
      'project_published',
      'support_ticket_updated',
      'support_ticket_resolved',
      'account_warned'
    )
  );

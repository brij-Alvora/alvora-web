-- Project workspace notifications. ALTER only.

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
      'account_warned',
      'project_score_updated'
    )
  );

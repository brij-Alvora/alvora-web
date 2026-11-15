-- Keep notifications.type aligned with the app. ALTER-only.
-- 20261016_project_workspace.sql narrowed this check after
-- 20261016_notifications_system.sql widened it.

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
      'project_score_updated',
      'reputation_increased',
      'validation_opportunity',
      'validation_request_accepted',
      'validation_request_declined',
      'review_acknowledged'
    )
  );

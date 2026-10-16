-- Notification system expansion. ALTER only.

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

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'in_app';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS email_status text;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_channel_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_channel_check CHECK (
    channel IN ('in_app', 'email', 'both')
  );

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_email_status_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_email_status_check CHECK (
    email_status IS NULL
    OR email_status IN ('pending', 'sent', 'skipped')
  );

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Sprint 7 trust layer: ALTER existing Sprint 7 tables, expand account
-- status, add moderation_actions and admin_alerts. Does not drop tables.

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text;

UPDATE public.notifications
SET message = COALESCE(message, body)
WHERE message IS NULL AND body IS NOT NULL;

UPDATE public.notifications
SET is_read = true
WHERE read_at IS NOT NULL AND is_read = false;

UPDATE public.notifications
SET entity_id = COALESCE(entity_id, source_id)
WHERE entity_id IS NULL AND source_id IS NOT NULL;

UPDATE public.notifications
SET entity_type = CASE type
  WHEN 'review_received' THEN 'review'
  WHEN 'validation_completed' THEN 'validation_request'
  WHEN 'reputation_level_up' THEN 'user'
  WHEN 'project_published' THEN 'project'
  WHEN 'support_ticket_updated' THEN 'support_ticket'
  WHEN 'support_ticket_resolved' THEN 'support_ticket'
  ELSE entity_type
END
WHERE entity_type IS NULL;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'review_received',
      'validation_completed',
      'reputation_level_up',
      'project_published',
      'support_ticket_updated',
      'support_ticket_resolved'
    )
  );

DROP INDEX IF EXISTS notifications_user_type_source_key;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_oneshot_key
  ON public.notifications (user_id, type, entity_type, entity_id)
  WHERE entity_id IS NOT NULL
    AND type <> 'support_ticket_updated';

CREATE INDEX IF NOT EXISTS notifications_user_unread_is_read_idx
  ON public.notifications (user_id)
  WHERE is_read = false;

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.reports
SET
  entity_type = COALESCE(entity_type, target_type),
  entity_id = COALESCE(entity_id, target_id),
  description = COALESCE(description, details);

UPDATE public.reports
SET reason = 'inappropriate_content'
WHERE reason IN ('inappropriate', 'misinformation');

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_entity_type_check CHECK (
    COALESCE(entity_type, target_type) IN (
      'user',
      'project',
      'validation_request',
      'review'
    )
  );

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reason_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_reason_check CHECK (
    reason IN (
      'spam',
      'harassment',
      'fake_project',
      'manipulated_review',
      'inappropriate_content',
      'other'
    )
  );

-- ---------------------------------------------------------------------------
-- Support tickets
-- ---------------------------------------------------------------------------
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.support_tickets
SET description = COALESCE(description, message)
WHERE description IS NULL;

UPDATE public.support_tickets SET status = 'assigned' WHERE status = 'under_review';
UPDATE public.support_tickets SET status = 'closed' WHERE status = 'dismissed';

ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_priority_check;
ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'critical')
  );

ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;
ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_category_check CHECK (
    category IN (
      'account',
      'project',
      'validation',
      'review',
      'bug_report',
      'feature_request',
      'contact_founder'
    )
  );

ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_status_check CHECK (
    status IN ('open', 'assigned', 'resolved', 'closed')
  );

CREATE INDEX IF NOT EXISTS support_tickets_priority_idx
  ON public.support_tickets (priority, created_at DESC);

-- ---------------------------------------------------------------------------
-- Account status
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check CHECK (
    account_status IN ('active', 'warned', 'suspended', 'banned')
  );

-- ---------------------------------------------------------------------------
-- Moderation audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_actions_entity_idx
  ON public.moderation_actions (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_actions_admin_idx
  ON public.moderation_actions (admin_id, created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Admin alerts foundation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text,
  entity_type text,
  entity_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_alerts_severity_check CHECK (
    severity IN ('info', 'warning', 'critical')
  )
);

CREATE INDEX IF NOT EXISTS admin_alerts_unread_idx
  ON public.admin_alerts (created_at DESC)
  WHERE is_read = false;

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Mentor acquisition events and first-touch UTMs.

CREATE TABLE IF NOT EXISTS public.acquisition_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  event_name text NOT NULL,
  path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acquisition_events_name_check CHECK (
    event_name IN (
      'founding_mentor_page_viewed',
      'invited_mentor_continue_clicked',
      'signup_started',
      'signup_completed',
      'profile_completed',
      'mentor_approved'
    )
  )
);

CREATE INDEX IF NOT EXISTS acquisition_events_session_idx
  ON public.acquisition_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS acquisition_events_user_idx
  ON public.acquisition_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS acquisition_events_name_idx
  ON public.acquisition_events (event_name, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS acquisition_events_session_event_once
  ON public.acquisition_events (session_id, event_name)
  WHERE event_name IN (
    'founding_mentor_page_viewed',
    'invited_mentor_continue_clicked',
    'signup_started'
  );

CREATE UNIQUE INDEX IF NOT EXISTS acquisition_events_user_event_once
  ON public.acquisition_events (user_id, event_name)
  WHERE user_id IS NOT NULL
    AND event_name IN (
      'signup_completed',
      'profile_completed',
      'mentor_approved'
    );

ALTER TABLE public.acquisition_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages acquisition events" ON public.acquisition_events;
CREATE POLICY "Service role manages acquisition events"
  ON public.acquisition_events
  FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

GRANT SELECT, INSERT, UPDATE ON public.acquisition_events TO service_role;

CREATE OR REPLACE VIEW public.mentor_acquisition_funnel AS
WITH invited AS (
  SELECT DISTINCT session_id
  FROM public.acquisition_events
  WHERE event_name = 'founding_mentor_page_viewed'
)
SELECT
  step.event_name,
  step.sort_order,
  COUNT(DISTINCT e.session_id)::int AS sessions
FROM (
  VALUES
    ('founding_mentor_page_viewed', 1),
    ('invited_mentor_continue_clicked', 2),
    ('signup_started', 3),
    ('signup_completed', 4),
    ('profile_completed', 5),
    ('mentor_approved', 6)
) AS step(event_name, sort_order)
LEFT JOIN public.acquisition_events e
  ON e.event_name = step.event_name
 AND e.session_id IN (SELECT session_id FROM invited)
GROUP BY step.event_name, step.sort_order
ORDER BY step.sort_order;

GRANT SELECT ON public.mentor_acquisition_funnel TO service_role;

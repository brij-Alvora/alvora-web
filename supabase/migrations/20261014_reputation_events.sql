-- Sprint 4: reputation engine on existing public.reputation_events
-- Does NOT drop the table or existing columns
-- (id, user_id, event_type, points, created_at stay).

ALTER TABLE public.reputation_events
  ADD COLUMN IF NOT EXISTS source_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS reputation_events_user_type_source_key
  ON public.reputation_events (user_id, event_type, source_id);

CREATE INDEX IF NOT EXISTS reputation_events_user_id_created_at_idx
  ON public.reputation_events (user_id, created_at DESC);

ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reputation events" ON public.reputation_events;
CREATE POLICY "Anyone can read reputation events"
  ON public.reputation_events
  FOR SELECT
  USING (true);

-- Reputation engine: extend existing public.reputation_events
-- Does NOT drop the table or original columns.

DROP INDEX IF EXISTS public.reputation_events_user_type_source_key;

ALTER TABLE public.reputation_events
  ADD COLUMN IF NOT EXISTS source_id text;

ALTER TABLE public.reputation_events
  ADD COLUMN IF NOT EXISTS metadata jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reputation_events'
      AND column_name = 'source_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.reputation_events
      ALTER COLUMN source_id TYPE text USING source_id::text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS reputation_events_type_source_key
  ON public.reputation_events (event_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reputation_events_user_id_created_at_idx
  ON public.reputation_events (user_id, created_at DESC);

ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reputation events" ON public.reputation_events;
DROP POLICY IF EXISTS "Users can read own reputation events" ON public.reputation_events;
CREATE POLICY "Users can read own reputation events"
  ON public.reputation_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert reputation events" ON public.reputation_events;
DROP POLICY IF EXISTS "Users can update reputation events" ON public.reputation_events;
DROP POLICY IF EXISTS "Users can delete reputation events" ON public.reputation_events;

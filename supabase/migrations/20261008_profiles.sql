-- Alvora Sprint 1 — safe upgrade for existing public.profiles
-- Does NOT recreate the table.
-- Does NOT drop any columns.
-- Preserves existing rows (user_id, reputation_score, etc. remain intact).

-- 1) Add required application columns (nullable first)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 2) Backfill new columns for existing rows (required before NOT NULL / UNIQUE)
UPDATE public.profiles
SET
  username = COALESCE(
    NULLIF(username, ''),
    'user_' || substr(replace(COALESCE(user_id, id)::text, '-', ''), 1, 12)
  ),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE username IS NULL
   OR username = ''
   OR updated_at IS NULL;

-- Resolve any rare username collisions after backfill
UPDATE public.profiles AS p
SET username = left(p.username, 20) || '_' || substr(replace(COALESCE(p.user_id, p.id)::text, '-', ''), 1, 8)
WHERE EXISTS (
  SELECT 1
  FROM public.profiles AS other
  WHERE other.username = p.username
    AND other.ctid <> p.ctid
);

-- 3) Enforce application defaults / nullability
ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN username SET NOT NULL;

-- 4) Enforce username uniqueness (skip if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- 5) Username format check used by the app (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_format'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format
      CHECK (username ~ '^[a-z0-9_]{3,30}$');
  END IF;
END $$;

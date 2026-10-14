-- Optional structured geography. location text remains the source of truth
-- until the profile form writes city/country directly.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text;

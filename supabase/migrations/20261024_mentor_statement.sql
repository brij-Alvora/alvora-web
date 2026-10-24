-- Mentors write their own statement. The founding-mentor flag stays service-role only.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mentor_statement text;

GRANT UPDATE (mentor_statement) ON TABLE public.profiles TO authenticated;

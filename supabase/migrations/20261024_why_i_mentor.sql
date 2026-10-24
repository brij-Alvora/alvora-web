-- Optional mentor personality. The founding-mentor flag stays service-role only.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS why_i_mentor text;

GRANT UPDATE (why_i_mentor) ON TABLE public.profiles TO authenticated;

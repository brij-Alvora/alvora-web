-- Do NOT run policy DDL against storage.objects in the SQL editor.
-- That table is owned by supabase_storage_admin ("must be owner of table objects").
-- Create Storage policies in: Dashboard → Storage → avatars → Policies.
-- The app uploads avatars with SUPABASE_SERVICE_ROLE_KEY instead.
--
-- Optional: you may run the profiles policies below (you own public.profiles).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can insert profile by user_id" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update profile by user_id" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

CREATE POLICY "Profiles are publicly readable"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Owners can insert profile by user_id"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Owners can update profile by user_id"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

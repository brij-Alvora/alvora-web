-- Sprint 6: admin role, account status, review moderation
-- ALTER only. Does not drop existing tables or columns.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended'));

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_moderation_status_check;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_moderation_status_check
  CHECK (moderation_status IN ('visible', 'hidden', 'flagged'));

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles (account_status);
CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx ON public.reviews (moderation_status);

-- Upgrade existing public.projects for Sprint 2.
-- Does NOT drop the table or any existing columns.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.projects
SET
  slug = COALESCE(
    NULLIF(slug, ''),
    trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
  ),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE slug IS NULL OR slug = '' OR updated_at IS NULL;

UPDATE public.projects AS p
SET slug = left(COALESCE(NULLIF(p.slug, ''), 'project'), 40) || '-' || substr(replace(p.id::text, '-', ''), 1, 8)
WHERE p.slug IS NULL
   OR p.slug = ''
   OR EXISTS (
     SELECT 1
     FROM public.projects AS other
     WHERE other.slug = p.slug
       AND other.id <> p.id
   );

ALTER TABLE public.projects
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key ON public.projects (slug);

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published projects are publicly readable" ON public.projects;
CREATE POLICY "Published projects are publicly readable"
  ON public.projects
  FOR SELECT
  USING (status = 'published' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert projects" ON public.projects;
CREATE POLICY "Owners can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update projects" ON public.projects;
CREATE POLICY "Owners can update projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete projects" ON public.projects;
CREATE POLICY "Owners can delete projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

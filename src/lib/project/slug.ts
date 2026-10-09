export function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug.length >= 2 ? slug : "project";
}

export function uniqueSlug(base: string, id: string): string {
  return `${base.slice(0, 40)}-${id.replace(/-/g, "").slice(0, 8)}`;
}

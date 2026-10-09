import type { Project, ProjectStatus } from "@/lib/supabase/types";

const STATUSES: ProjectStatus[] = ["draft", "published", "archived"];

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRequiredString(value: unknown, fallback = ""): string {
  return asNullableString(value) ?? fallback;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function asStatus(value: unknown): ProjectStatus {
  if (typeof value === "string" && STATUSES.includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }
  return "draft";
}

export function mapProject(row: Record<string, unknown> | null): Project | null {
  if (!row) return null;
  const title = asRequiredString(row.title);
  if (!title) return null;

  return {
    id: asRequiredString(row.id),
    owner_id: asRequiredString(row.owner_id),
    title,
    slug: asRequiredString(row.slug, asRequiredString(row.id)),
    short_description: asNullableString(row.short_description),
    description: asNullableString(row.description),
    category: asNullableString(row.category),
    tags: asTags(row.tags),
    github_url: asNullableString(row.github_url),
    demo_url: asNullableString(row.demo_url),
    thumbnail_url: asNullableString(row.thumbnail_url),
    status: asStatus(row.status),
    validation_score:
      typeof row.validation_score === "number" ? row.validation_score : 0,
    published_at: asNullableString(row.published_at),
    created_at: asRequiredString(row.created_at),
    updated_at: asRequiredString(row.updated_at, asRequiredString(row.created_at)),
  };
}

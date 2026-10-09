import type { Profile } from "@/lib/supabase/types";

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRequiredString(value: unknown, fallback = ""): string {
  return asNullableString(value) ?? fallback;
}

/**
 * Maps a raw Supabase `profiles` row onto the app Profile shape.
 * Reads live column names only — never injects mock content.
 */
export function mapProfile(row: Record<string, unknown> | null): Profile | null {
  if (!row) return null;

  const username = asRequiredString(row.username);
  if (!username) return null;

  return {
    id: asRequiredString(row.id),
    user_id: asNullableString(row.user_id),
    username,
    full_name: asNullableString(row.full_name),
    headline: asNullableString(row.headline),
    bio: asNullableString(row.bio),
    location: asNullableString(row.location),
    website: asNullableString(row.website),
    github_url: asNullableString(row.github_url),
    linkedin_url: asNullableString(row.linkedin_url),
    avatar_url: asNullableString(row.avatar_url),
    reputation_score:
      typeof row.reputation_score === "number" ? row.reputation_score : null,
    created_at: asRequiredString(row.created_at),
    updated_at: asRequiredString(row.updated_at, asRequiredString(row.created_at)),
  };
}

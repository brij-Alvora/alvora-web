import type { Profile } from "@/lib/supabase/types";

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRequiredString(value: unknown, fallback = ""): string {
  return asNullableString(value) ?? fallback;
}

function asExpertise(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
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
    city: asNullableString(row.city),
    country: asNullableString(row.country),
    website: asNullableString(row.website),
    github_url: asNullableString(row.github_url),
    linkedin_url: asNullableString(row.linkedin_url),
    avatar_url: asNullableString(row.avatar_url),
    reputation_score:
      typeof row.reputation_score === "number" ? row.reputation_score : null,
    role: row.role === "admin" ? "admin" : "user",
    account_status:
      row.account_status === "warned" ||
      row.account_status === "suspended" ||
      row.account_status === "banned"
        ? row.account_status
        : "active",
    is_founding_mentor: row.is_founding_mentor === true,
    expertise: asExpertise(row.expertise),
    mentor_statement: asNullableString(row.mentor_statement),
    why_i_mentor: asNullableString(row.why_i_mentor),
    created_at: asRequiredString(row.created_at),
    updated_at: asRequiredString(row.updated_at, asRequiredString(row.created_at)),
  };
}

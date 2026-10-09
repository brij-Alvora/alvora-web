import type { Profile } from "@/lib/supabase/types";

const COMPLETION_FIELDS = [
  "username",
  "full_name",
  "headline",
  "bio",
  "location",
  "website",
  "github_url",
  "linkedin_url",
  "avatar_url",
] as const satisfies ReadonlyArray<keyof Profile>;

export function hasProfileValue(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getFirstName(
  fullName: string | null | undefined,
  fallback: string,
): string {
  if (!hasProfileValue(fullName)) return fallback;
  return fullName.trim().split(/\s+/)[0] ?? fallback;
}

export function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getProfileCompletion(profile: Profile): {
  percent: number;
  filled: number;
  total: number;
} {
  const filled = COMPLETION_FIELDS.filter((field) =>
    hasProfileValue(profile[field]),
  ).length;

  return {
    filled,
    total: COMPLETION_FIELDS.length,
    percent: Math.round((filled / COMPLETION_FIELDS.length) * 100),
  };
}

export function displayUrlHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

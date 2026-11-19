import { hasProfileValue } from "@/lib/profile/presentation";

export type DiscoverTab = "mentors" | "projects";

export type ProjectReviewStatus = "reviewed" | "in_review" | "awaiting_review";

export type ProjectSort = "most_reviewed" | "newest" | "highest_rated" | "trending";
export type MentorSort = "most_active" | "highest_rated" | "newest" | "founding";

export const PROJECT_REVIEW_STATUS_LABEL: Record<ProjectReviewStatus, string> =
  {
    reviewed: "Reviewed",
    in_review: "In review",
    awaiting_review: "Awaiting review",
  };

export const PROJECT_CATEGORY_FILTERS = [
  "AI",
  "SaaS",
  "Developer Tools",
  "Productivity",
  "Education",
  "Healthcare",
  "Fintech",
] as const;

export const MENTOR_EXPERTISE_FILTERS = [
  "Product",
  "Engineering",
  "Design",
  "Marketing",
  "Founder",
  "AI",
] as const;

export const PROJECT_SORT_OPTIONS: Array<{ id: ProjectSort; label: string }> = [
  { id: "most_reviewed", label: "Most Reviewed" },
  { id: "newest", label: "Newest" },
  { id: "highest_rated", label: "Highest Rated" },
  { id: "trending", label: "Trending" },
];

export const MENTOR_SORT_OPTIONS: Array<{ id: MentorSort; label: string }> = [
  { id: "most_active", label: "Most Active" },
  { id: "highest_rated", label: "Highest Rated" },
  { id: "newest", label: "Newest" },
  { id: "founding", label: "Founding Mentors" },
];

export function parseDiscoverTab(value: string): DiscoverTab {
  return value === "mentors" ? "mentors" : "projects";
}

export function parseProjectSort(value: string): ProjectSort {
  if (
    value === "newest" ||
    value === "highest_rated" ||
    value === "trending" ||
    value === "most_reviewed"
  ) {
    return value;
  }
  return "trending";
}

export function parseMentorSort(value: string): MentorSort {
  if (
    value === "highest_rated" ||
    value === "newest" ||
    value === "founding" ||
    value === "most_active"
  ) {
    return value;
  }
  return "most_active";
}

export function parseHeadlineParts(headline: string | null | undefined): {
  title: string | null;
  company: string | null;
} {
  const text = headline?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return { title: null, company: null };
  const at = text.match(/^(.*?)\s+(?:at|@)\s+(.+)$/i);
  if (at) {
    return { title: at[1].trim() || null, company: at[2].trim() || null };
  }
  return { title: text, company: null };
}

export function loginNextHref(nextPath: string) {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function clipDiscoverText(
  value: string | null | undefined,
  max = 160,
): string | null {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function builderLabel(profile: {
  username: string;
  full_name: string | null;
} | null) {
  if (!profile) return "Builder";
  if (hasProfileValue(profile.full_name)) return profile.full_name;
  return `@${profile.username}`;
}

export function reviewSummaryText(review: {
  review_text: string | null;
  what_works_well: string | null;
  recommendations: string | null;
}): string | null {
  return clipDiscoverText(
    review.review_text || review.what_works_well || review.recommendations,
  );
}

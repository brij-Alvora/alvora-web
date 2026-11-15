export type DiscoverTab = "mentors" | "projects";

export type ProjectReviewStatus = "reviewed" | "in_review" | "awaiting_review";

export const PROJECT_REVIEW_STATUS_LABEL: Record<ProjectReviewStatus, string> =
  {
    reviewed: "Reviewed",
    in_review: "In review",
    awaiting_review: "Awaiting review",
  };

export function parseDiscoverTab(value: string): DiscoverTab {
  return value === "projects" ? "projects" : "mentors";
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

export function reviewSummaryText(review: {
  review_text: string | null;
  what_works_well: string | null;
  recommendations: string | null;
}): string | null {
  return clipDiscoverText(
    review.review_text || review.what_works_well || review.recommendations,
  );
}

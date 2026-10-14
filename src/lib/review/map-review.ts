import type { Review } from "@/lib/supabase/types";

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asString(value: unknown, fallback = ""): string {
  return asNullableString(value) ?? fallback;
}

function asRating(value: unknown): number | null {
  const rating = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

export function mapReview(row: Record<string, unknown> | null): Review | null {
  if (!row) return null;
  const rating = asRating(row.rating);
  const projectId = asString(row.project_id);
  const reviewerId = asString(row.reviewer_id);
  if (rating == null || !projectId || !reviewerId) return null;

  return {
    id: asString(row.id),
    project_id: projectId,
    reviewer_id: reviewerId,
    validation_request_id: asNullableString(row.validation_request_id),
    rating,
    review_text: asNullableString(row.review_text),
    what_works_well: asNullableString(row.what_works_well),
    improvement_areas: asNullableString(row.improvement_areas),
    recommendations: asNullableString(row.recommendations),
    created_at: asString(row.created_at),
  };
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

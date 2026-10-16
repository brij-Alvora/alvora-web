import { averageRating } from "@/lib/review/map-review";
import {
  REPUTATION_EVENT_LABELS,
  isReputationEventType,
} from "@/lib/reputation/rules";
import type {
  Project,
  ReputationEvent,
  Review,
  ValidationRequest,
} from "@/lib/supabase/types";

export type FeedbackSnapshot = {
  strength: string | null;
  improvement: string | null;
  recommendation: string | null;
};

export type ProjectHealth = "good" | "improving" | "needs_attention";

export const PROJECT_HEALTH_LABEL: Record<ProjectHealth, string> = {
  good: "Good",
  improving: "Improving",
  needs_attention: "Needs Attention",
};

export type ProjectPerformance = {
  project: Project;
  score: number | null;
  ratingAverage: number | null;
  reviewCount: number;
  requestCount: number;
  completedCount: number;
  pendingCount: number;
  reputationPoints: number;
  trend: "up" | "down" | "steady" | "new";
  health: ProjectHealth;
  snapshot: FeedbackSnapshot;
};

export type WorkspaceFeedItem = {
  id: string;
  kind: "review" | "validation";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
};

export type ReviewContribution = {
  id: string;
  rating: number;
  projectTitle: string;
  projectHref: string | null;
  validationHref: string | null;
  createdAt: string;
  strength: string | null;
  improvement: string | null;
  recommendation: string | null;
};

function clip(value: string | null, max = 110): string | null {
  if (!value) return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function scoreFromRatings(ratings: number[]): number | null {
  const average = averageRating(
    ratings.map((rating) => ({ rating }) as Review),
  );
  if (average == null) return null;
  return Math.round(average * 20);
}

/**
 * Health is derived, not stored.
 * Needs Attention: no reviews, rating below 3.5, or ratings trending down.
 * Improving: recent ratings are up, or mid-range ratings with active validations.
 * Good: rating 3.5+ and not declining.
 */
export function projectHealth(input: {
  ratingAverage: number | null;
  reviewCount: number;
  trend: ProjectPerformance["trend"];
  completedCount: number;
  pendingCount: number;
}): ProjectHealth {
  const rating = input.ratingAverage;
  if (input.reviewCount === 0 || rating == null) return "needs_attention";
  if (input.trend === "down" || rating < 3.5) return "needs_attention";
  if (input.trend === "up") return "improving";
  if (rating < 4 && (input.completedCount > 0 || input.pendingCount > 0)) {
    return "improving";
  }
  return "good";
}

function ratingTrend(ratingsChronological: number[]): ProjectPerformance["trend"] {
  if (ratingsChronological.length < 2) return "new";
  const newest = ratingsChronological.slice(-3);
  const older = ratingsChronological.slice(0, -newest.length);
  if (older.length === 0) return "steady";
  const avg = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const delta = avg(newest) - avg(older);
  if (delta >= 0.3) return "up";
  if (delta <= -0.3) return "down";
  return "steady";
}

export function snapshotFromReviews(reviews: Review[]): FeedbackSnapshot {
  const latest = [...reviews].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  if (!latest) {
    return { strength: null, improvement: null, recommendation: null };
  }
  return {
    strength: clip(latest.what_works_well),
    improvement: clip(latest.improvement_areas),
    recommendation: clip(latest.recommendations),
  };
}

export function projectIdFromEvent(event: ReputationEvent): string | null {
  const metadata = event.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as { project_id?: unknown }).project_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function buildProjectPerformance(input: {
  project: Project;
  reviews: Review[];
  requests: ValidationRequest[];
  reputationEvents: ReputationEvent[];
}): ProjectPerformance {
  const visible = input.reviews.filter(
    (review) => review.moderation_status === "visible",
  );
  const chronological = [...visible].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const pendingCount = input.requests.filter(
    (request) => request.status === "open" || request.status === "in_review",
  ).length;
  const completedCount = input.requests.filter(
    (request) => request.status === "completed",
  ).length;
  const reputationPoints = input.reputationEvents
    .filter((event) => projectIdFromEvent(event) === input.project.id)
    .reduce((sum, event) => sum + event.points, 0);
  const trend = ratingTrend(chronological.map((review) => review.rating));
  const ratingAverage = averageRating(visible);

  return {
    project: input.project,
    score: scoreFromRatings(visible.map((review) => review.rating)),
    ratingAverage,
    reviewCount: visible.length,
    requestCount: input.requests.length,
    completedCount,
    pendingCount,
    reputationPoints,
    trend,
    health: projectHealth({
      ratingAverage,
      reviewCount: visible.length,
      trend,
      completedCount,
      pendingCount,
    }),
    snapshot: snapshotFromReviews(visible),
  };
}

export function reputationLabel(eventType: string): string {
  if (isReputationEventType(eventType)) {
    return REPUTATION_EVENT_LABELS[eventType];
  }
  return "Reputation";
}

const PROJECT_SOURCE_TYPES = new Set([
  "project_published",
  "first_project_published",
  "validation_request_created",
  "validation_completed",
  "validation_completed_retracted",
]);

const REVIEW_SOURCE_TYPES = new Set([
  "review_submitted",
  "review_retracted",
  "first_review_bonus",
  "first_review_bonus_retracted",
]);

export function splitReputationSources(events: ReputationEvent[]): {
  fromProjects: number;
  fromReviews: number;
} {
  return events.reduce(
    (totals, event) => {
      if (PROJECT_SOURCE_TYPES.has(event.event_type)) {
        totals.fromProjects += event.points;
      } else if (REVIEW_SOURCE_TYPES.has(event.event_type)) {
        totals.fromReviews += event.points;
      }
      return totals;
    },
    { fromProjects: 0, fromReviews: 0 },
  );
}

export function reputationContributionLabel(
  reviews: number,
  validations: number,
): string | null {
  const parts: string[] = [];
  if (reviews > 0) {
    parts.push(`${reviews} ${reviews === 1 ? "review" : "reviews"}`);
  }
  if (validations > 0) {
    parts.push(
      `${validations} ${validations === 1 ? "validation" : "validations"}`,
    );
  }
  if (parts.length === 0) return null;
  return `from ${parts.join(" and ")}`;
}

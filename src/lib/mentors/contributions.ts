import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/supabase/types";

export type MentorContributionMetrics = {
  reviewsContributed: number;
  projectsReviewed: number;
  buildersHelped: number;
  validationsCompleted: number;
};

export const EMPTY_MENTOR_CONTRIBUTIONS: MentorContributionMetrics = {
  reviewsContributed: 0,
  projectsReviewed: 0,
  buildersHelped: 0,
  validationsCompleted: 0,
};

export type MentorReviewRecord = {
  projectId: string;
  validationRequestId: string | null;
};

export function mentorAuthIds(profile: Profile) {
  return [
    ...new Set(
      [profile.user_id, profile.id].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ];
}

export function hasMentorContributions(metrics: MentorContributionMetrics) {
  return (
    metrics.reviewsContributed > 0 ||
    metrics.projectsReviewed > 0 ||
    metrics.buildersHelped > 0 ||
    metrics.validationsCompleted > 0
  );
}

export function summarizeMentorContributions(input: {
  mentorIds: string[];
  reviews: MentorReviewRecord[];
  projectOwners: ReadonlyMap<string, string>;
  completedRequestIds: ReadonlySet<string>;
}): MentorContributionMetrics {
  const mentorIds = new Set(input.mentorIds);
  const projects = new Set<string>();
  const builders = new Set<string>();
  const validations = new Set<string>();

  for (const review of input.reviews) {
    if (!review.projectId) continue;
    projects.add(review.projectId);
    const owner = input.projectOwners.get(review.projectId);
    if (owner && !mentorIds.has(owner)) builders.add(owner);
    if (
      review.validationRequestId &&
      input.completedRequestIds.has(review.validationRequestId)
    ) {
      validations.add(review.validationRequestId);
    }
  }

  return {
    reviewsContributed: input.reviews.length,
    projectsReviewed: projects.size,
    buildersHelped: builders.size,
    validationsCompleted: validations.size,
  };
}

export async function getMentorContributionMap(
  profiles: Profile[],
): Promise<Map<string, MentorContributionMetrics>> {
  const metrics = new Map<string, MentorContributionMetrics>();
  for (const profile of profiles) {
    metrics.set(profile.id, { ...EMPTY_MENTOR_CONTRIBUTIONS });
  }
  if (profiles.length === 0) return metrics;

  const ids = [...new Set(profiles.flatMap(mentorAuthIds))];
  if (ids.length === 0) return metrics;

  const admin = createAdminClient();
  const { data: reviewRows } = await admin
    .from("reviews")
    .select("reviewer_id, project_id, validation_request_id")
    .in("reviewer_id", ids)
    .eq("moderation_status", "visible");

  const reviews = Array.isArray(reviewRows) ? reviewRows : [];
  const projectIds = [
    ...new Set(
      reviews
        .map((row) => (typeof row.project_id === "string" ? row.project_id : ""))
        .filter(Boolean),
    ),
  ];
  const requestIds = [
    ...new Set(
      reviews
        .map((row) =>
          typeof row.validation_request_id === "string"
            ? row.validation_request_id
            : "",
        )
        .filter(Boolean),
    ),
  ];

  const projectOwners = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await admin
      .from("projects")
      .select("id, owner_id")
      .in("id", projectIds);
    if (Array.isArray(projects)) {
      for (const project of projects) {
        if (typeof project.id === "string" && typeof project.owner_id === "string") {
          projectOwners.set(project.id, project.owner_id);
        }
      }
    }
  }

  const completedRequestIds = new Set<string>();
  if (requestIds.length > 0) {
    const { data: requests } = await admin
      .from("validation_requests")
      .select("id, status")
      .in("id", requestIds)
      .eq("status", "completed");
    if (Array.isArray(requests)) {
      for (const request of requests) {
        if (typeof request.id === "string") completedRequestIds.add(request.id);
      }
    }
  }

  for (const profile of profiles) {
    const keys = new Set(mentorAuthIds(profile));
    const ownReviews: MentorReviewRecord[] = [];
    for (const row of reviews) {
      const reviewerId = typeof row.reviewer_id === "string" ? row.reviewer_id : "";
      if (!keys.has(reviewerId)) continue;
      ownReviews.push({
        projectId: typeof row.project_id === "string" ? row.project_id : "",
        validationRequestId:
          typeof row.validation_request_id === "string"
            ? row.validation_request_id
            : null,
      });
    }
    metrics.set(
      profile.id,
      summarizeMentorContributions({
        mentorIds: [...keys],
        reviews: ownReviews,
        projectOwners,
        completedRequestIds,
      }),
    );
  }

  return metrics;
}

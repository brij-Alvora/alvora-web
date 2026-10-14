import { mapProfile } from "@/lib/profile/map-profile";
import { mapProject } from "@/lib/project/map-project";
import {
  awardProfileCompletedIfEligible,
  awardProjectPublished,
  awardReviewSubmitted,
  awardValidationCompleted,
  awardValidationCreated,
} from "@/lib/reputation/award";
import { mapReview } from "@/lib/review/map-review";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapValidationRequest } from "@/lib/validation/map-request";

export type ReputationBackfillResult = {
  profiles: number;
  projects: number;
  validationRequests: number;
  validationsCompleted: number;
  reviews: number;
};

export async function backfillReputationEvents(): Promise<ReputationBackfillResult> {
  const admin = createAdminClient();
  const result: ReputationBackfillResult = {
    profiles: 0,
    projects: 0,
    validationRequests: 0,
    validationsCompleted: 0,
    reviews: 0,
  };

  const { data: profileRows } = await admin.from("profiles").select("*");
  for (const row of profileRows ?? []) {
    const profile = mapProfile(row as Record<string, unknown>);
    if (!profile) continue;
    const userId = profile.user_id ?? profile.id;
    await awardProfileCompletedIfEligible(userId, profile);
    result.profiles += 1;
  }

  const { data: projectRows } = await admin
    .from("projects")
    .select("*")
    .eq("status", "published");
  for (const row of projectRows ?? []) {
    const project = mapProject(row as Record<string, unknown>);
    if (!project) continue;
    await awardProjectPublished(project.owner_id, project.id);
    result.projects += 1;
  }

  const { data: requestRows } = await admin.from("validation_requests").select("*");
  for (const row of requestRows ?? []) {
    const request = mapValidationRequest(row as Record<string, unknown>);
    if (!request) continue;
    await awardValidationCreated(
      request.requested_by,
      request.id,
      request.project_id,
    );
    result.validationRequests += 1;
    if (request.status === "completed") {
      await awardValidationCompleted(
        request.requested_by,
        request.id,
        request.project_id,
      );
      result.validationsCompleted += 1;
    }
  }

  const { data: reviewRows } = await admin.from("reviews").select("*");
  for (const row of reviewRows ?? []) {
    const review = mapReview(row as Record<string, unknown>);
    if (!review) continue;
    await awardReviewSubmitted(
      review.reviewer_id,
      review.id,
      review.validation_request_id ?? review.id,
      review.project_id,
    );
    result.reviews += 1;
  }

  return result;
}

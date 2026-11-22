import type { ProjectStatus } from "@/lib/supabase/types";

import { canReviewProject } from "@/lib/security/review-rules";

export type ValidationRequestVisibilityInput = {
  readerId: string | null;
  requestedBy: string;
  projectOwnerId: string;
  projectStatus: ProjectStatus;
};

export type ValidationRequestInsertInput = {
  actorId: string;
  requestedBy: string;
  projectOwnerId: string;
};

export type ReviewInsertInput = {
  reviewerId: string;
  ownerId: string | null | undefined;
  requestedBy: string | null | undefined;
  projectStatus: ProjectStatus | null | undefined;
  projectId: string;
  validationRequestId: string | null | undefined;
  requestProjectId: string | null | undefined;
};

/**
 * Pre-P0 validation_requests SELECT: any signed-in user could read every row.
 * Kept so regression tests can show the draft-brief leak.
 */
export function legacyMemberCanSelectValidationRequest(
  input: ValidationRequestVisibilityInput,
) {
  return Boolean(input.readerId);
}

/**
 * P0: requester, project owner, or queue on a published project.
 * Draft briefs are not a public review queue.
 */
export function memberCanSelectValidationRequest(
  input: ValidationRequestVisibilityInput,
) {
  if (!input.readerId) return false;
  if (input.readerId === input.requestedBy) return true;
  if (input.readerId === input.projectOwnerId) return true;
  return input.projectStatus === "published";
}

/**
 * Pre-P0 INSERT: only requested_by = actor. Any project_id was accepted.
 */
export function legacyMemberCanInsertValidationRequest(
  input: ValidationRequestInsertInput,
) {
  return input.actorId === input.requestedBy;
}

/** P0: must own the project and set requested_by to self. */
export function memberCanInsertValidationRequest(
  input: ValidationRequestInsertInput,
) {
  return (
    input.actorId === input.requestedBy &&
    input.actorId === input.projectOwnerId
  );
}

/**
 * Pre-P0 reviews INSERT: independent reviewer, optional null request,
 * unpublished projects allowed if the id was known.
 */
export function legacyMemberCanInsertReview(input: ReviewInsertInput) {
  return canReviewProject({
    reviewerId: input.reviewerId,
    ownerId: input.ownerId,
    requestedBy: input.requestedBy,
  });
}

/**
 * P0: named request that belongs to this project, published only, no orphans.
 */
export function memberCanInsertReview(input: ReviewInsertInput) {
  if (!input.validationRequestId) return false;
  if (!input.requestProjectId || input.requestProjectId !== input.projectId) {
    return false;
  }
  if (input.projectStatus !== "published") return false;
  return canReviewProject(input);
}

/** Members never write validation_score. Service role (score sync) may. */
export function memberCanUpdateValidationScore(actorRole: string | null) {
  return actorRole === "service_role";
}

export function applyValidationScoreLock(input: {
  actorRole: string | null | undefined;
  op: "INSERT" | "UPDATE";
  oldScore?: number;
  newScore: number;
}) {
  if (input.actorRole === "service_role") return input.newScore;
  if (input.op === "INSERT") return 0;
  return input.oldScore ?? 0;
}

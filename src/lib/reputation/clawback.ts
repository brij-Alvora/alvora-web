import { insertReputationEvent } from "@/lib/reputation/insert-event";
import {
  REPUTATION_POINTS,
  type ReputationEventType,
} from "@/lib/reputation/rules";
import { hasIndependentVisibleReview } from "@/lib/security/independent-review";
import { createAdminClient } from "@/lib/supabase/admin";

async function eventExists(
  eventType: ReputationEventType,
  sourceId: string,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reputation_events")
    .select("id")
    .eq("event_type", eventType)
    .eq("source_id", sourceId)
    .maybeSingle();
  return Boolean(data);
}

async function reverseIfAwarded(input: {
  userId: string;
  originalType: ReputationEventType;
  reverseType: ReputationEventType;
  sourceId: string;
  metadata?: { review_id?: string; validation_id?: string; project_id?: string };
}) {
  const awarded = await eventExists(input.originalType, input.sourceId);
  if (!awarded) return false;
  const already = await eventExists(input.reverseType, input.sourceId);
  if (already) return false;
  const result = await insertReputationEvent({
    userId: input.userId,
    eventType: input.reverseType,
    sourceId: input.sourceId,
    metadata: input.metadata,
  });
  return result.created;
}

async function restoreIfReversed(input: {
  reverseType: ReputationEventType;
  sourceId: string;
}) {
  const admin = createAdminClient();
  await admin
    .from("reputation_events")
    .delete()
    .eq("event_type", input.reverseType)
    .eq("source_id", input.sourceId);
}

async function countVisibleReviewsByReviewer(reviewerId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", reviewerId)
    .eq("moderation_status", "visible");
  return count ?? 0;
}

export async function reverseReputationForReview(review: {
  id: string;
  reviewer_id: string;
  project_id: string;
  validation_request_id: string | null;
}): Promise<void> {
  await reverseIfAwarded({
    userId: review.reviewer_id,
    originalType: "review_submitted",
    reverseType: "review_retracted",
    sourceId: review.id,
    metadata: {
      review_id: review.id,
      validation_id: review.validation_request_id ?? undefined,
      project_id: review.project_id,
    },
  });

  const remaining = await countVisibleReviewsByReviewer(review.reviewer_id);
  if (remaining === 0) {
    await reverseIfAwarded({
      userId: review.reviewer_id,
      originalType: "first_review_bonus",
      reverseType: "first_review_bonus_retracted",
      sourceId: `first_review:${review.reviewer_id}`,
      metadata: { review_id: review.id, project_id: review.project_id },
    });
  }

  if (!review.validation_request_id) return;

  const stillQualified = await hasIndependentVisibleReview({
    validationId: review.validation_request_id,
    projectId: review.project_id,
  });
  if (stillQualified) return;

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("validation_requests")
    .select("id, requested_by, project_id, status")
    .eq("id", review.validation_request_id)
    .maybeSingle();
  if (!request?.requested_by) return;

  await reverseIfAwarded({
    userId: request.requested_by,
    originalType: "validation_completed",
    reverseType: "validation_completed_retracted",
    sourceId: request.id,
    metadata: {
      validation_id: request.id,
      project_id: request.project_id,
      review_id: review.id,
    },
  });
}

export async function restoreReputationForReview(review: {
  id: string;
  reviewer_id: string;
  project_id: string;
  validation_request_id: string | null;
}): Promise<void> {
  await restoreIfReversed({
    reverseType: "review_retracted",
    sourceId: review.id,
  });

  const remaining = await countVisibleReviewsByReviewer(review.reviewer_id);
  if (remaining > 0) {
    await restoreIfReversed({
      reverseType: "first_review_bonus_retracted",
      sourceId: `first_review:${review.reviewer_id}`,
    });
  }

  if (!review.validation_request_id) return;

  const qualified = await hasIndependentVisibleReview({
    validationId: review.validation_request_id,
    projectId: review.project_id,
  });
  if (qualified) {
    await restoreIfReversed({
      reverseType: "validation_completed_retracted",
      sourceId: review.validation_request_id,
    });
  }
}

export function clawbackPointsFor(eventType: ReputationEventType) {
  return REPUTATION_POINTS[eventType];
}

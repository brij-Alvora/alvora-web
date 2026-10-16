import { revalidatePath } from "next/cache";

import { createNotification } from "@/lib/notifications/create";
import { getProfileCompletion } from "@/lib/profile/presentation";
import { calculateReputation } from "@/lib/reputation/calculator";
import {
  countPairwiseReviewAwards,
  countUserEvents,
  insertReputationEvent,
  type ReputationMetadata,
} from "@/lib/reputation/insert-event";
import {
  PAIRWISE_REVIEW_LIMIT,
  PAIRWISE_WINDOW_MS,
} from "@/lib/reputation/pairwise";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROFILE_COMPLETION_THRESHOLD,
  REPUTATION_EVENT_LABELS,
  REPUTATION_POINTS,
  type ReputationEventType,
} from "@/lib/reputation/rules";
import { hasIndependentVisibleReview } from "@/lib/security/independent-review";
import type { Profile } from "@/lib/supabase/types";

function revalidateReputation() {
  try {
    revalidatePath("/dashboard");
    revalidatePath("/reputation");
  } catch {
    /* backfill and scripts run outside a Next.js request */
  }
}

export async function awardReputationEvent(input: {
  userId: string;
  eventType: ReputationEventType;
  sourceId: string;
  metadata?: ReputationMetadata;
}): Promise<boolean> {
  try {
    const before = await calculateReputation(input.userId);
    const result = await insertReputationEvent(input);
    if (result.error) return false;
    if (result.created) {
      revalidateReputation();
      const points = REPUTATION_POINTS[input.eventType];
      if (points <= 0) return result.created;
      await createNotification({
        userId: input.userId,
        type: "reputation_increased",
        title: "Reputation increased",
        message: `+${points} from ${REPUTATION_EVENT_LABELS[input.eventType]}.`,
        href: "/reputation",
        entityType: "user",
        entityId: `${input.eventType}:${input.sourceId}`,
      });
      const after = await calculateReputation(input.userId);
      if (before.level !== after.level) {
        await createNotification({
          userId: input.userId,
          type: "reputation_level_up",
          title: `You reached ${after.level}`,
          message: `Your reputation is now ${after.total_points} points.`,
          href: "/reputation",
          entityType: "user",
          entityId: `level:${after.level}`,
        });
      }
    }
    return result.created;
  } catch (error) {
    console.error(
      "[reputation] award failed",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export async function awardProfileCompletedIfEligible(
  userId: string,
  profile: Profile | null,
): Promise<void> {
  if (!profile) return;
  if (getProfileCompletion(profile).percent < PROFILE_COMPLETION_THRESHOLD) {
    return;
  }
  await awardReputationEvent({
    userId,
    eventType: "profile_completed",
    sourceId: userId,
    metadata: {},
  });
}

export async function awardProjectPublished(
  userId: string,
  projectId: string,
): Promise<void> {
  const created = await awardReputationEvent({
    userId,
    eventType: "project_published",
    sourceId: projectId,
    metadata: { project_id: projectId },
  });
  if (created) {
    await createNotification({
      userId,
      type: "project_published",
      title: "Project published",
      message: "Your project is now live on Discover.",
      href: "/projects",
      entityType: "project",
      entityId: projectId,
    });
  }

  const publishedCount = await countUserEvents(userId, "project_published");
  if (publishedCount < 1) return;

  await awardReputationEvent({
    userId,
    eventType: "first_project_published",
    sourceId: `first_project:${userId}`,
    metadata: { project_id: projectId },
  });
}

export async function awardValidationCreated(
  userId: string,
  validationId: string,
  projectId: string,
): Promise<void> {
  await awardReputationEvent({
    userId,
    eventType: "validation_request_created",
    sourceId: validationId,
    metadata: { validation_id: validationId, project_id: projectId },
  });
}

export async function awardValidationCompleted(
  userId: string,
  validationId: string,
  projectId: string,
): Promise<void> {
  const qualified = await hasIndependentVisibleReview({
    validationId,
    projectId,
    requestedBy: userId,
  });
  if (!qualified) return;

  const created = await awardReputationEvent({
    userId,
    eventType: "validation_completed",
    sourceId: validationId,
    metadata: { validation_id: validationId, project_id: projectId },
  });
  if (created) {
    await createNotification({
      userId,
      type: "validation_completed",
      title: "Validation completed",
      message: "A validation request is now marked completed.",
      href: `/validations/${validationId}`,
      entityType: "validation_request",
      entityId: validationId,
    });
  }
}

export async function awardReviewSubmitted(
  userId: string,
  reviewId: string,
  validationId: string,
  projectId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();
  const ownerId =
    typeof project?.owner_id === "string" ? project.owner_id : "";
  const sinceIso = new Date(Date.now() - PAIRWISE_WINDOW_MS).toISOString();
  const pairwiseCount = ownerId
    ? await countPairwiseReviewAwards({
        reviewerId: userId,
        ownerId,
        sinceIso,
      })
    : 0;
  if (pairwiseCount >= PAIRWISE_REVIEW_LIMIT) return;

  const created = await awardReputationEvent({
    userId,
    eventType: "review_submitted",
    sourceId: reviewId,
    metadata: {
      review_id: reviewId,
      validation_id: validationId,
      project_id: projectId,
      owner_id: ownerId || undefined,
      reviewer_id: userId,
    },
  });
  if (!created) return;

  const reviewCount = await countUserEvents(userId, "review_submitted");
  if (reviewCount < 1) return;

  await awardReputationEvent({
    userId,
    eventType: "first_review_bonus",
    sourceId: `first_review:${userId}`,
    metadata: {
      review_id: reviewId,
      validation_id: validationId,
      project_id: projectId,
      owner_id: ownerId || undefined,
      reviewer_id: userId,
    },
  });
}

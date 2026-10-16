"use server";

import { revalidatePath } from "next/cache";

import { toUserSafeError } from "@/lib/errors/user-safe";
import { createNotification } from "@/lib/notifications/create";
import { notifyUsers } from "@/lib/notifications/dispatch";
import { syncProjectValidationScore } from "@/lib/projects/update-score";
import { awardReviewSubmitted } from "@/lib/reputation/award";
import { canReviewProject } from "@/lib/security/review-rules";
import { assertCanContribute } from "@/lib/trust/account";
import { mapReview } from "@/lib/review/map-review";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";
import { reviewSchema } from "@/lib/validations/review";

export type ReviewActionResult = {
  error?: string;
  success?: string;
  review?: Review;
};

function composeReviewText(input: {
  what_works_well: string;
  improvement_areas: string;
  recommendations: string;
}) {
  return [
    "What works well:",
    input.what_works_well,
    "",
    "Improvement areas:",
    input.improvement_areas,
    "",
    "Recommendations:",
    input.recommendations,
  ].join("\n");
}

export async function submitReviewAction(
  input: unknown,
): Promise<ReviewActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to submit a review" };
  const blocked = await assertCanContribute(user.id);
  if (blocked) return { error: blocked };

  const { data: requestRow, error: requestError } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("id", parsed.data.validation_request_id)
    .maybeSingle();

  const request = mapValidationRequest(
    (requestRow ?? null) as Record<string, unknown> | null,
  );
  if (!request) {
    return { error: toUserSafeError(requestError, "Validation request not found") };
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("slug, owner_id, title")
    .eq("id", request.project_id)
    .maybeSingle();
  const ownerId =
    typeof projectRow?.owner_id === "string" ? projectRow.owner_id : null;

  if (
    !canReviewProject({
      reviewerId: user.id,
      ownerId,
      requestedBy: request.requested_by,
    })
  ) {
    return {
      error:
        ownerId === user.id
          ? "You cannot review a project you own"
          : "You cannot review your own validation request",
    };
  }

  const { data: existingMine } = await supabase
    .from("reviews")
    .select("id")
    .eq("validation_request_id", request.id)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (existingMine) {
    return { error: "You already submitted a review for this request" };
  }

  const payload = {
    project_id: request.project_id,
    reviewer_id: user.id,
    validation_request_id: request.id,
    rating: parsed.data.rating,
    what_works_well: parsed.data.what_works_well,
    improvement_areas: parsed.data.improvement_areas,
    recommendations: parsed.data.recommendations,
    review_text: composeReviewText(parsed.data),
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(payload)
    .select("*")
    .single();

  const saved = (data ?? null) as Record<string, unknown> | null;
  const errorMessage = error?.message;

  const review = mapReview(saved);
  if (!review) {
    return { error: toUserSafeError(errorMessage, "Could not save review") };
  }

  const wasOpen = request.status === "open";
  if (wasOpen) {
    await supabase
      .from("validation_requests")
      .update({ status: "in_review" })
      .eq("id", request.id)
      .eq("status", "open");
  }

  const projectTitle =
    typeof projectRow?.title === "string" ? projectRow.title : "your project";
  const scoreChange = await syncProjectValidationScore(request.project_id);

  await awardReviewSubmitted(
    user.id,
    review.id,
    request.id,
    request.project_id,
  );

  const recipients = new Set<string>();
  if (request.requested_by !== user.id) recipients.add(request.requested_by);
  if (ownerId && ownerId !== user.id) recipients.add(ownerId);
  await notifyUsers([...recipients], {
    type: "review_received",
    title: "Review received",
    message: `${projectTitle} received a ${review.rating}★ review.`,
    href: `/projects/${request.project_id}/feedback`,
    entityType: "review",
    entityId: review.id,
  });

  if (wasOpen) {
    await notifyUsers([...recipients], {
      type: "validation_request_accepted",
      title: "Validation request accepted",
      message: `A validator started reviewing “${request.request_title}”.`,
      href: `/validations/${request.id}`,
      entityType: "validation_request",
      entityId: `${request.id}:accepted`,
    });
  }

  if (
    scoreChange &&
    scoreChange.previous !== scoreChange.next &&
    ownerId &&
    ownerId !== user.id
  ) {
    await createNotification({
      userId: ownerId,
      type: "project_score_updated",
      title: "Project score updated",
      message: `${projectTitle} is now ${scoreChange.next} from reviewer ratings.`,
      href: `/projects/${request.project_id}/feedback`,
      entityType: "project",
      entityId: `${request.project_id}:${scoreChange.next}:${review.id}`,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/projects/given");
  revalidatePath(`/projects/${request.project_id}/feedback`);
  revalidatePath("/validations");
  revalidatePath(`/validations/${request.id}`);
  if (projectRow?.slug) revalidatePath(`/project/${projectRow.slug}`);

  return { success: "Review saved", review };
}

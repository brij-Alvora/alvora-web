"use server";

import { revalidatePath } from "next/cache";

import { toUserSafeError } from "@/lib/errors/user-safe";
import {
  getActiveValidatorIds,
  getReviewerIdsForRequest,
  notifyUsers,
} from "@/lib/notifications/dispatch";
import { getAccessibleProject } from "@/lib/project/queries";
import { assertCanContribute } from "@/lib/trust/account";
import {
  awardValidationCompleted,
  awardValidationCreated,
} from "@/lib/reputation/award";
import { hasIndependentVisibleReview } from "@/lib/security/independent-review";
import { canManuallySetValidationStatus } from "@/lib/security/validation-status";
import { createClient } from "@/lib/supabase/server";
import type { ValidationRequest, ValidationStatus } from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";
import { validationRequestSchema } from "@/lib/validations/validation-request";

export type ValidationActionResult = {
  error?: string;
  success?: string;
  request?: ValidationRequest;
};

function revalidateValidationSurfaces(
  request: ValidationRequest,
  projectSlug?: string | null,
) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/validations");
  revalidatePath(`/validations/${request.id}`);
  if (projectSlug) revalidatePath(`/project/${projectSlug}`);
}

export async function createValidationRequestAction(
  input: unknown,
): Promise<ValidationActionResult> {
  const parsed = validationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to request validation" };
  const blocked = await assertCanContribute(user.id);
  if (blocked) return { error: blocked };

  const project = await getAccessibleProject(parsed.data.project_id);
  if (!project) {
    return { error: "Select a published or owned project" };
  }

  const payload = {
    project_id: parsed.data.project_id,
    requested_by: user.id,
    validation_type: parsed.data.validation_type,
    request_title: parsed.data.request_title,
    request_text: parsed.data.request_text,
    status: "open" as const,
  };

  const { data, error } = await supabase
    .from("validation_requests")
    .insert(payload)
    .select("*")
    .single();

  const saved = (data ?? null) as Record<string, unknown> | null;
  const errorMessage = error?.message;

  const request = mapValidationRequest(saved);
  if (!request) {
    return {
      error: toUserSafeError(errorMessage, "Could not create validation request"),
    };
  }

  await awardValidationCreated(user.id, request.id, request.project_id);

  const validators = await getActiveValidatorIds(user.id);
  await notifyUsers(validators, {
    type: "validation_opportunity",
    title: "New validation opportunity",
    message: `${request.request_title} is open for review.`,
    href: `/validations/${request.id}`,
    entityType: "validation_request",
    entityId: request.id,
  });

  revalidateValidationSurfaces(request, project.slug);
  return { success: "Validation request created", request };
}

export async function updateValidationStatusAction(
  requestId: string,
  status: ValidationStatus,
): Promise<ValidationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { data: existing, error: loadError } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (loadError || !existing) {
    return { error: toUserSafeError(loadError, "Request not found") };
  }

  const current = mapValidationRequest(existing as Record<string, unknown>);
  if (!current) return { error: "Request not found" };

  const { data: projectRow } = await supabase
    .from("projects")
    .select("owner_id, slug")
    .eq("id", current.project_id)
    .maybeSingle();

  const canUpdate =
    current.requested_by === user.id || projectRow?.owner_id === user.id;
  if (!canUpdate) {
    return { error: "You cannot update this request" };
  }

  const qualified = await hasIndependentVisibleReview({
    validationId: current.id,
    projectId: current.project_id,
    requestedBy: current.requested_by,
  });
  if (
    !canManuallySetValidationStatus({
      from: current.status,
      to: status,
      hasIndependentReview: qualified,
    })
  ) {
    return {
      error:
        current.status === "completed"
          ? "Completed validations cannot return to open. They reopen only if qualifying reviews are removed."
          : "That status change is not allowed.",
    };
  }
  if (status === "completed" && !qualified) {
    return {
      error:
        "Complete a validation only after at least one independent visible review.",
    };
  }

  const { data, error } = await supabase
    .from("validation_requests")
    .update({ status })
    .eq("id", requestId)
    .select("*")
    .maybeSingle();

  const saved = (data ?? null) as Record<string, unknown> | null;

  const request = mapValidationRequest(saved);
  if (!request) {
    return { error: toUserSafeError(error, "Could not update status") };
  }

  if (request.status === "in_review" && current.status !== "in_review") {
    await notifyUsers([request.requested_by, projectRow?.owner_id], {
      type: "validation_request_accepted",
      title: "Validation request accepted",
      message: `A validator started reviewing “${request.request_title}”.`,
      href: `/validations/${request.id}`,
      entityType: "validation_request",
      entityId: `${request.id}:accepted`,
    });
  }

  if (request.status === "completed") {
    await awardValidationCompleted(
      request.requested_by,
      request.id,
      request.project_id,
    );
    const reviewers = await getReviewerIdsForRequest(request.id);
    await notifyUsers(reviewers, {
      type: "review_acknowledged",
      title: "Review acknowledged",
      message: `Your review on “${request.request_title}” was included in a completed validation.`,
      href: `/validations/${request.id}`,
      entityType: "validation_request",
      entityId: `${request.id}:acknowledged`,
    });
  }

  revalidateValidationSurfaces(request, projectRow?.slug);
  return { success: "Status updated", request };
}

export async function declineValidationRequestAction(
  requestId: string,
): Promise<ValidationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };
  const blocked = await assertCanContribute(user.id);
  if (blocked) return { error: blocked };

  const { data: existing } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  const request = mapValidationRequest(
    (existing ?? null) as Record<string, unknown> | null,
  );
  if (!request) return { error: "Request not found" };
  if (request.requested_by === user.id) {
    return { error: "You cannot decline your own request" };
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("owner_id, slug")
    .eq("id", request.project_id)
    .maybeSingle();

  await notifyUsers([request.requested_by, projectRow?.owner_id], {
    type: "validation_request_declined",
    title: "Validation request declined",
    message: `A validator declined to review “${request.request_title}”.`,
    href: `/validations/${request.id}`,
    entityType: "validation_request",
    entityId: `${request.id}:declined:${user.id}`,
  });

  revalidateValidationSurfaces(request, projectRow?.slug);
  return { success: "Request declined", request };
}

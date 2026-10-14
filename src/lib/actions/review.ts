"use server";

import { revalidatePath } from "next/cache";

import { mapReview } from "@/lib/review/map-review";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const { data: requestRow, error: requestError } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("id", parsed.data.validation_request_id)
    .maybeSingle();

  const request = mapValidationRequest(
    (requestRow ?? null) as Record<string, unknown> | null,
  );
  if (!request) {
    return { error: requestError?.message ?? "Validation request not found" };
  }

  if (request.requested_by === user.id) {
    return { error: "You cannot review your own validation request" };
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

  let saved = (data ?? null) as Record<string, unknown> | null;
  let errorMessage = error?.message;

  if (!saved) {
    try {
      const admin = createAdminClient();
      const { data: adminData, error: adminError } = await admin
        .from("reviews")
        .insert(payload)
        .select("*")
        .single();
      saved = (adminData ?? null) as Record<string, unknown> | null;
      errorMessage = adminError?.message ?? errorMessage;
    } catch (adminError) {
      errorMessage =
        adminError instanceof Error ? adminError.message : errorMessage;
    }
  }

  const review = mapReview(saved);
  if (!review) {
    return { error: errorMessage ?? "Could not save review" };
  }

  if (request.status === "open") {
    const { error: statusError } = await supabase
      .from("validation_requests")
      .update({ status: "in_review" })
      .eq("id", request.id)
      .eq("status", "open");

    if (statusError) {
      try {
        const admin = createAdminClient();
        await admin
          .from("validation_requests")
          .update({ status: "in_review" })
          .eq("id", request.id)
          .eq("status", "open");
      } catch {
        /* status stays Open until an owner updates it */
      }
    }
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", request.project_id)
    .maybeSingle();

  revalidatePath("/dashboard");
  revalidatePath("/validations");
  revalidatePath(`/validations/${request.id}`);
  if (projectRow?.slug) revalidatePath(`/project/${projectRow.slug}`);

  return { success: "Review saved", review };
}

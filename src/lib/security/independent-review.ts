import {
  canCompleteValidation,
  type IndependentReviewInput,
} from "@/lib/security/review-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loadIndependentReviewContext(input: {
  validationId: string;
  projectId?: string | null;
  requestedBy?: string | null;
}): Promise<{
  reviews: IndependentReviewInput[];
  ownerId: string | null;
  requestedBy: string | null;
}> {
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("validation_requests")
    .select("id, project_id, requested_by")
    .eq("id", input.validationId)
    .maybeSingle();

  const projectId = input.projectId ?? request?.project_id ?? null;
  const requestedBy = input.requestedBy ?? request?.requested_by ?? null;

  const [{ data: project }, { data: reviewRows }] = await Promise.all([
    projectId
      ? admin.from("projects").select("owner_id").eq("id", projectId).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("reviews")
      .select("reviewer_id, moderation_status")
      .eq("validation_request_id", input.validationId),
  ]);

  return {
    ownerId:
      typeof project?.owner_id === "string" ? project.owner_id : null,
    requestedBy: typeof requestedBy === "string" ? requestedBy : null,
    reviews: (reviewRows ?? []).map((row) => ({
      reviewer_id: String(row.reviewer_id ?? ""),
      moderation_status: String(row.moderation_status ?? "visible"),
    })),
  };
}

export async function hasIndependentVisibleReview(input: {
  validationId: string;
  projectId?: string | null;
  requestedBy?: string | null;
}) {
  const context = await loadIndependentReviewContext(input);
  return canCompleteValidation(context);
}

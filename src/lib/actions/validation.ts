"use server";

import { revalidatePath } from "next/cache";

import { getAccessibleProject } from "@/lib/project/queries";
import {
  awardValidationCompleted,
  awardValidationCreated,
} from "@/lib/reputation/award";
import { createAdminClient } from "@/lib/supabase/admin";
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

  let saved = (data ?? null) as Record<string, unknown> | null;
  let errorMessage = error?.message;

  if (!saved) {
    try {
      const admin = createAdminClient();
      const { data: adminData, error: adminError } = await admin
        .from("validation_requests")
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

  const request = mapValidationRequest(saved);
  if (!request) {
    return { error: errorMessage ?? "Could not create validation request" };
  }

  await awardValidationCreated(user.id, request.id, request.project_id);

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
    return { error: loadError?.message ?? "Request not found" };
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

  const { data, error } = await supabase
    .from("validation_requests")
    .update({ status })
    .eq("id", requestId)
    .select("*")
    .maybeSingle();

  let saved = (data ?? null) as Record<string, unknown> | null;
  if (!saved) {
    try {
      const admin = createAdminClient();
      const { data: adminData } = await admin
        .from("validation_requests")
        .update({ status })
        .eq("id", requestId)
        .select("*")
        .maybeSingle();
      saved = (adminData ?? null) as Record<string, unknown> | null;
    } catch {
      /* fall through */
    }
  }

  const request = mapValidationRequest(saved);
  if (!request) return { error: error?.message ?? "Could not update status" };

  if (request.status === "completed") {
    await awardValidationCompleted(
      request.requested_by,
      request.id,
      request.project_id,
    );
  }

  revalidateValidationSurfaces(request, projectRow?.slug);
  return { success: "Status updated", request };
}

import type {
  ValidationRequest,
  ValidationStatus,
  ValidationType,
} from "@/lib/supabase/types";
import {
  VALIDATION_STATUSES,
  VALIDATION_TYPES,
} from "@/lib/validations/validation-request";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asType(value: unknown): ValidationType | null {
  return VALIDATION_TYPES.includes(value as ValidationType)
    ? (value as ValidationType)
    : null;
}

function asStatus(value: unknown): ValidationStatus {
  if (VALIDATION_STATUSES.includes(value as ValidationStatus)) {
    return value as ValidationStatus;
  }
  return "open";
}

export function mapValidationRequest(
  row: Record<string, unknown> | null,
): ValidationRequest | null {
  if (!row) return null;
  const validationType = asType(row.validation_type);
  const title = asString(row.request_title).trim();
  const projectId = asString(row.project_id);
  if (!validationType || !title || !projectId) return null;

  return {
    id: asString(row.id),
    project_id: projectId,
    requested_by: asString(row.requested_by),
    validation_type: validationType,
    request_title: title,
    request_text: asString(row.request_text).trim() || null,
    status: asStatus(row.status),
    created_at: asString(row.created_at),
  };
}

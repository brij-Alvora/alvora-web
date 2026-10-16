import type { ValidationStatus } from "@/lib/supabase/types";
import { VALIDATION_STATUSES } from "@/lib/validations/validation-request";

export function canManuallySetValidationStatus(input: {
  from: ValidationStatus;
  to: ValidationStatus;
  hasIndependentReview: boolean;
}) {
  if (input.from === input.to) return true;
  if (input.from !== "completed") return true;
  if (input.to === "open") return false;
  if (input.to === "in_review") return !input.hasIndependentReview;
  return false;
}

export function allowedManualValidationStatuses(
  current: ValidationStatus,
  hasIndependentReview: boolean,
): ValidationStatus[] {
  return VALIDATION_STATUSES.filter((status) =>
    canManuallySetValidationStatus({
      from: current,
      to: status,
      hasIndependentReview,
    }),
  );
}

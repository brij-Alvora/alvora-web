"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateValidationStatusAction } from "@/lib/actions/validation";
import { allowedManualValidationStatuses } from "@/lib/security/validation-status";
import type { ValidationStatus } from "@/lib/supabase/types";
import { VALIDATION_STATUS_LABELS } from "@/lib/validations/validation-request";
import { Button } from "@/components/ui/button";

type ValidationStatusControlsProps = {
  requestId: string;
  current: ValidationStatus;
  hasIndependentReview?: boolean;
};

export function ValidationStatusControls({
  requestId,
  current,
  hasIndependentReview = true,
}: ValidationStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {allowedManualValidationStatuses(current, hasIndependentReview).map(
        (status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={status === current ? "default" : "outline"}
          disabled={isPending || status === current}
          onClick={() => {
            startTransition(async () => {
              await updateValidationStatusAction(requestId, status);
              router.refresh();
            });
          }}
        >
          {VALIDATION_STATUS_LABELS[status]}
        </Button>
      ),
      )}
    </div>
  );
}

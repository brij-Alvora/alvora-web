"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateValidationStatusAction } from "@/lib/actions/validation";
import type { ValidationStatus } from "@/lib/supabase/types";
import { VALIDATION_STATUS_LABELS } from "@/lib/validations/validation-request";
import { Button } from "@/components/ui/button";

type ValidationStatusControlsProps = {
  requestId: string;
  current: ValidationStatus;
};

const NEXT: ValidationStatus[] = ["open", "in_review", "completed"];

export function ValidationStatusControls({
  requestId,
  current,
}: ValidationStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {NEXT.map((status) => (
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
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { adminUpdateValidationStatusAction } from "@/lib/actions/admin";
import type { ValidationStatus } from "@/lib/supabase/types";
import { VALIDATION_STATUS_LABELS } from "@/lib/validations/validation-request";
import { Button } from "@/components/ui/button";

type ValidationStatusFormProps = {
  requestId: string;
  current: ValidationStatus;
};

const STATUSES: ValidationStatus[] = ["open", "in_review", "completed"];

export function ValidationStatusForm({
  requestId,
  current,
}: ValidationStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/admin/validations/${requestId}`}>View</Link>
      </Button>
      {STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={status === current ? "default" : "outline"}
          disabled={isPending || status === current}
          onClick={() => {
            startTransition(async () => {
              await adminUpdateValidationStatusAction(requestId, status);
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

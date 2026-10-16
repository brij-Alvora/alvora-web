"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { declineValidationRequestAction } from "@/lib/actions/validation";
import { Button } from "@/components/ui/button";

export function ValidatorResponse({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <Link href={`/validations/${requestId}/review`}>Accept & review</Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await declineValidationRequestAction(requestId);
            router.refresh();
          });
        }}
      >
        {isPending ? "Declining..." : "Decline"}
      </Button>
    </div>
  );
}

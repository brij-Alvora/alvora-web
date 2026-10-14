"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { moderateReviewAction } from "@/lib/actions/admin";
import type { ModerationStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

type ReviewModerationActionsProps = {
  reviewId: string;
  status: ModerationStatus;
};

export function ReviewModerationActions({
  reviewId,
  status,
}: ReviewModerationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (next: ModerationStatus | "deleted") => {
    startTransition(async () => {
      await moderateReviewAction(reviewId, next);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "hidden" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run("hidden")}
        >
          Hide
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run("visible")}
        >
          Unhide
        </Button>
      )}
      {status !== "flagged" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run("flagged")}
        >
          Flag
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run("visible")}
        >
          Clear flag
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          if (confirm("Delete this review permanently?")) run("deleted");
        }}
      >
        Delete
      </Button>
    </div>
  );
}

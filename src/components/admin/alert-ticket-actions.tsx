"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  updateReportStatusAction,
  updateSupportTicketAction,
} from "@/lib/actions/admin";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

type AlertTicketActionsProps = {
  href: string;
  source: "ticket" | "report" | "alert";
  entityId: string;
  mode: "resolve" | "reopen";
};

export function AlertTicketActions({
  href,
  source,
  entityId,
  mode,
}: AlertTicketActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const result =
        source === "report"
          ? await updateReportStatusAction(
              entityId,
              mode === "reopen" ? "open" : "resolved",
            )
          : await updateSupportTicketAction(
              entityId,
              mode === "reopen" ? "open" : "closed",
            );
      if (result.error) toast(result.error, "error");
      else toast(result.success ?? "Updated");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={href}>Open source entity</Link>
      </Button>
      {source !== "alert" ? (
        <Button
          size="sm"
          variant={mode === "reopen" ? "default" : "outline"}
          disabled={isPending}
          onClick={run}
        >
          {isPending
            ? "Saving..."
            : mode === "reopen"
              ? "Reopen alert"
              : "Resolve alert"}
        </Button>
      ) : null}
    </div>
  );
}

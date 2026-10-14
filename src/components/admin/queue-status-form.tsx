"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  updateReportStatusAction,
  updateSupportTicketAction,
} from "@/lib/actions/admin";
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUSES,
  type ReportQueueStatus,
} from "@/lib/reports/types";
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUSES,
  type SupportStatus,
} from "@/lib/support/types";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type QueueStatusFormProps = {
  kind: "report" | "ticket";
  id: string;
  current: string;
  notes?: string | null;
};

export function QueueStatusForm({
  kind,
  id,
  current,
  notes,
}: QueueStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statuses =
    kind === "report"
      ? REPORT_STATUSES.map((status) => ({
          value: status,
          label: REPORT_STATUS_LABELS[status],
        }))
      : SUPPORT_STATUSES.map((status) => ({
          value: status,
          label: SUPPORT_STATUS_LABELS[status],
        }));

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const status = String(form.get("status"));
        const text = String(form.get("notes") ?? "");
        startTransition(async () => {
          let result;
          if (kind === "report") {
            result = await updateReportStatusAction(
              id,
              status as ReportQueueStatus,
              text,
            );
          } else {
            result = await updateSupportTicketAction(
              id,
              status as SupportStatus,
              text,
            );
          }
          if (result.error) toast(result.error, "error");
          else toast(result.success ?? "Updated");
          router.refresh();
        });
      }}
    >
      <select
        name="status"
        defaultValue={current}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-xs"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <Textarea
        name="notes"
        defaultValue={notes ?? ""}
        placeholder={kind === "report" ? "Moderation notes" : "Reply to the user"}
        rows={3}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving..." : "Update"}
      </Button>
    </form>
  );
}

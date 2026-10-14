"use client";

import { useState, useTransition } from "react";

import { submitReportAction } from "@/lib/actions/report";
import {
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  REPORT_TARGET_LABELS,
  type ReportTargetType,
} from "@/lib/reports/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
};

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
      >
        Report {REPORT_TARGET_LABELS[targetType].toLowerCase()}
      </Button>
      {open ? (
        <form
          className="space-y-3 rounded-lg border border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            startTransition(async () => {
              setError(null);
              setMessage(null);
              const result = await submitReportAction({
                target_type: targetType,
                target_id: targetId,
                reason: form.get("reason"),
                details: form.get("details") ?? "",
              });
              if (result.error) setError(result.error);
              else {
                setMessage(result.success ?? "Report submitted");
                setOpen(false);
                formElement.reset();
              }
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={`reason-${targetId}`}>Reason</Label>
            <select
              id={`reason-${targetId}`}
              name="reason"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {REPORT_REASON_LABELS[reason]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`details-${targetId}`}>Details (optional)</Label>
            <Textarea id={`details-${targetId}`} name="details" rows={3} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit report"}
          </Button>
        </form>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

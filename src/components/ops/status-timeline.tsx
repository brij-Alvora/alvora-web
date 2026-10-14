import { cn } from "@/lib/utils";

export type TimelineStep = {
  key: string;
  label: string;
  reached: boolean;
};

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              step.reached
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span
              className="hidden text-muted-foreground sm:inline"
              aria-hidden
            >
              →
            </span>
          ) : null}
          {index < steps.length - 1 ? (
            <span className="pl-3 text-muted-foreground sm:hidden" aria-hidden>
              ↓
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function ticketTimeline(status: string): TimelineStep[] {
  const order = ["open", "assigned", "resolved", "closed"];
  const index = Math.max(0, order.indexOf(status));
  return [
    { key: "open", label: "Open", reached: index >= 0 },
    { key: "assigned", label: "Assigned", reached: index >= 1 },
    { key: "resolved", label: "Resolved", reached: index >= 2 },
    { key: "closed", label: "Closed", reached: status === "closed" },
  ];
}

export function reportTimeline(status: string): TimelineStep[] {
  if (status === "dismissed") {
    return [
      { key: "submitted", label: "Report Submitted", reached: true },
      { key: "review", label: "Under Review", reached: true },
      { key: "dismissed", label: "Dismissed", reached: true },
    ];
  }
  const index =
    status === "resolved" ? 2 : status === "under_review" ? 1 : 0;
  return [
    { key: "submitted", label: "Report Submitted", reached: index >= 0 },
    { key: "review", label: "Under Review", reached: index >= 1 },
    { key: "resolved", label: "Resolved", reached: index >= 2 },
  ];
}

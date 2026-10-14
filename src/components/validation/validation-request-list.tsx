import Link from "next/link";

import type { ValidationRequestWithProject } from "@/lib/validation/queries";
import {
  VALIDATION_STATUS_LABELS,
  VALIDATION_TYPE_LABELS,
} from "@/lib/validations/validation-request";
import { Card, CardContent } from "@/components/ui/card";

type ValidationRequestListProps = {
  requests: ValidationRequestWithProject[];
  emptyLabel: string;
};

export function ValidationRequestList({
  requests,
  emptyLabel,
}: ValidationRequestListProps) {
  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li key={request.id}>
          <Link href={`/validations/${request.id}`}>
            <Card className="shadow-sm transition-colors hover:bg-accent/40">
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{request.request_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {VALIDATION_TYPE_LABELS[request.validation_type]}
                    {request.project ? ` · ${request.project.title}` : ""}
                  </p>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {VALIDATION_STATUS_LABELS[request.status]}
                </span>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

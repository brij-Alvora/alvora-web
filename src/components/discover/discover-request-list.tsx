import Link from "next/link";

import { builderLabel } from "@/lib/discover/queries";
import type { DiscoverValidationRequest } from "@/lib/discover/queries";
import {
  VALIDATION_STATUS_LABELS,
  VALIDATION_TYPE_LABELS,
} from "@/lib/validations/validation-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverRequestListProps = {
  requests: DiscoverValidationRequest[];
  currentUserId: string;
};

export function DiscoverRequestList({
  requests,
  currentUserId,
}: DiscoverRequestListProps) {
  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No open validation requests right now.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => {
        const isOwn = request.requested_by === currentUserId;
        return (
          <li key={request.id}>
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{request.request_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.project ? request.project.title : "Project"}
                    {" · "}
                    {VALIDATION_TYPE_LABELS[request.validation_type]}
                    {" · "}
                    {builderLabel(request.builder)}
                  </p>
                  <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {VALIDATION_STATUS_LABELS[request.status]}
                  </span>
                </div>
                <Button asChild size="sm" variant={isOwn ? "outline" : "default"}>
                  <Link
                    href={
                      isOwn
                        ? `/validations/${request.id}`
                        : `/validations/${request.id}/review`
                    }
                  >
                    {isOwn ? "View request" : "Review request"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

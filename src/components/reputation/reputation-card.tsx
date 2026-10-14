import Link from "next/link";

import {
  REPUTATION_EVENT_LABELS,
  isReputationEventType,
} from "@/lib/reputation/rules";
import type { ReputationEvent } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReputationCardProps = {
  totalPoints: number;
  level: string;
  nextLevel: string | null;
  progress: number;
  recentEvent?: ReputationEvent | null;
  showHistoryLink?: boolean;
};

function eventLabel(event: ReputationEvent) {
  return isReputationEventType(event.event_type)
    ? REPUTATION_EVENT_LABELS[event.event_type]
    : event.event_type;
}

export function ReputationCard({
  totalPoints,
  level,
  nextLevel,
  progress,
  recentEvent = null,
  showHistoryLink = false,
}: ReputationCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reputation
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{level}</p>
            <p className="text-sm text-muted-foreground">
              {totalPoints} {totalPoints === 1 ? "point" : "points"}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {level}
          </span>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {nextLevel ? `Progress to ${nextLevel}` : "Top level reached"}
            </p>
            <p className="text-sm font-semibold tabular-nums">{progress}%</p>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={nextLevel ? `Progress to ${nextLevel}` : "Reputation progress"}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {recentEvent ? (
          <p className="text-sm text-muted-foreground">
            Recent:{" "}
            <span className="font-medium text-foreground">
              +{recentEvent.points} {eventLabel(recentEvent)}
            </span>
          </p>
        ) : null}

        {showHistoryLink ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/reputation">View history</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

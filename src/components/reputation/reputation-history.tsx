import { formatDiscoverDate } from "@/lib/discover/format";
import {
  REPUTATION_EVENT_LABELS,
  isReputationEventType,
} from "@/lib/reputation/rules";
import type { ReputationEvent } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";

type ReputationHistoryProps = {
  events: ReputationEvent[];
};

function eventLabel(event: ReputationEvent) {
  return isReputationEventType(event.event_type)
    ? REPUTATION_EVENT_LABELS[event.event_type]
    : event.event_type;
}

export function ReputationHistory({ events }: ReputationHistoryProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No reputation events yet. Complete your profile, publish a project, or
        submit a review to start earning points.
      </p>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 sm:px-5">Event</th>
              <th className="px-4 py-3 sm:px-5">Points</th>
              <th className="px-4 py-3 sm:px-5">Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium sm:px-5">
                  +{event.points} {eventLabel(event)}
                </td>
                <td className="px-4 py-3 tabular-nums sm:px-5">
                  +{event.points}
                </td>
                <td className="px-4 py-3 text-muted-foreground sm:px-5">
                  {formatDiscoverDate(event.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

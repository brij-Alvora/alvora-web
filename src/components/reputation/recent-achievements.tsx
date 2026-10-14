import {
  REPUTATION_EVENT_LABELS,
  isReputationEventType,
} from "@/lib/reputation/rules";
import type { ReputationEvent } from "@/lib/supabase/types";

type RecentAchievementsProps = {
  events: ReputationEvent[];
};

export function RecentAchievements({ events }: RecentAchievementsProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No achievements yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span>
            {isReputationEventType(event.event_type)
              ? REPUTATION_EVENT_LABELS[event.event_type]
              : event.event_type}
          </span>
          <span className="shrink-0 font-medium tabular-nums">+{event.points}</span>
        </li>
      ))}
    </ul>
  );
}

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  compareDate,
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminReputationEvents } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import {
  REPUTATION_EVENT_LABELS,
  isReputationEventType,
} from "@/lib/reputation/rules";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin events · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const sort = firstParam(params, "sort") || "newest";
  const type = firstParam(params, "type");
  const events = await getAdminReputationEvents();

  const filtered = events
    .filter((event) => {
      const label = isReputationEventType(event.event_type)
        ? REPUTATION_EVENT_LABELS[event.event_type]
        : event.event_type;
      const haystack = [label, event.event_type, event.user_id, event.source_id]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (type && event.event_type !== type) return false;
      return true;
    })
    .sort((a, b) =>
      sort === "oldest"
        ? compareDate(a.created_at, b.created_at)
        : compareDate(b.created_at, a.created_at),
    );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Reputation events
        </h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {events.length}{" "}
          {events.length === 1 ? "event" : "events"}
        </p>
      </div>
      <AdminToolbar
        placeholder="Search type, user, source"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
        ]}
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No events match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((event) => {
            const label = isReputationEventType(event.event_type)
              ? REPUTATION_EVENT_LABELS[event.event_type]
              : event.event_type;
            return (
              <li key={event.id}>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <p className="font-medium">
                      {label} · {event.points} pts
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDiscoverDate(event.created_at)} · user{" "}
                      {event.user_id.slice(0, 8)}
                      {event.source_id ? ` · ${event.source_id}` : ""}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import Link from "next/link";

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { KpiCards } from "@/components/admin/kpi-cards";
import { QueueStatusForm } from "@/components/admin/queue-status-form";
import {
  StatusTimeline,
  ticketTimeline,
} from "@/components/ops/status-timeline";
import {
  compareDate,
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminSupportTickets } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import {
  supportSla,
  ticketClosedAt,
  ticketResolutionMs,
} from "@/lib/ops/sla";
import { formatDuration } from "@/lib/ops/time";
import { getProfilesByAuthIds } from "@/lib/profile/queries";
import { hasProfileValue } from "@/lib/profile/presentation";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITIES,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUSES,
} from "@/lib/support/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin support · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

function adminLabel(
  profiles: Awaited<ReturnType<typeof getProfilesByAuthIds>>,
  adminId: string | null,
) {
  if (!adminId) return "Unassigned";
  const profile = profiles.get(adminId);
  if (profile && hasProfileValue(profile.full_name)) return profile.full_name;
  if (profile?.username) return `@${profile.username}`;
  return "Assigned admin";
}

export default async function AdminSupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const status = firstParam(params, "status");
  const priority = firstParam(params, "priority");
  const selected = firstParam(params, "ticket");
  const sort = firstParam(params, "sort") || "newest";
  const tickets = await getAdminSupportTickets();
  const sla = supportSla(tickets);
  const assignees = await getProfilesByAuthIds(
    tickets
      .map((ticket) => ticket.assigned_admin_id)
      .filter((id): id is string => Boolean(id)),
  );

  const filtered = tickets
    .filter((ticket) => {
      const haystack = [
        ticket.subject,
        ticket.message,
        ticket.category,
        ticket.user_id,
      ]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (status && ticket.status !== status) return false;
      if (priority && ticket.priority !== priority) return false;
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
        <h2 className="text-lg font-semibold tracking-tight">Support</h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {tickets.length}{" "}
          {tickets.length === 1 ? "ticket" : "tickets"}
        </p>
      </div>
      <KpiCards
        items={[
          { label: "Average Resolution Time", value: sla.averageResolution },
          {
            label: "Average First Response Time",
            value: sla.averageFirstResponse,
          },
          { label: "Tickets Opened Today", value: sla.openedToday },
          { label: "Tickets Closed Today", value: sla.closedToday },
        ]}
      />
      <AdminToolbar
        placeholder="Search subject, message, user"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
        ]}
        filters={[
          {
            name: "status",
            label: "All statuses",
            options: SUPPORT_STATUSES.map((value) => ({
              value,
              label: SUPPORT_STATUS_LABELS[value],
            })),
          },
          {
            name: "priority",
            label: "All priorities",
            options: SUPPORT_PRIORITIES.map((value) => ({
              value,
              label: SUPPORT_PRIORITY_LABELS[value],
            })),
          },
        ]}
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No tickets match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((ticket) => (
            <li key={ticket.id} id={`ticket-${ticket.id}`}>
              <Card
                className={cn(
                  "shadow-sm",
                  selected === ticket.id ? "border-primary/40" : "",
                )}
              >
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {SUPPORT_CATEGORY_LABELS[ticket.category]} ·{" "}
                      {SUPPORT_PRIORITY_LABELS[ticket.priority]} ·{" "}
                      {SUPPORT_STATUS_LABELS[ticket.status]}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {ticket.message}
                    </p>
                  </div>
                  <StatusTimeline steps={ticketTimeline(ticket.status)} />
                  <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>Created At {formatDiscoverDate(ticket.created_at)}</div>
                    <div>
                      First Response At{" "}
                      {formatDiscoverDate(ticket.first_response_at)}
                    </div>
                    <div>
                      Closed At {formatDiscoverDate(ticketClosedAt(ticket))}
                    </div>
                    <div>
                      Resolution Time {formatDuration(ticketResolutionMs(ticket))}
                    </div>
                    <div>
                      Assigned Admin{" "}
                      {adminLabel(assignees, ticket.assigned_admin_id)}
                    </div>
                  </dl>
                  <Link
                    href={`/admin/users/${ticket.user_id}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Open user
                  </Link>
                  <QueueStatusForm
                    kind="ticket"
                    id={ticket.id}
                    current={ticket.status}
                    notes={ticket.admin_reply}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

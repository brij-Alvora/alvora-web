import Link from "next/link";

import { AlertTicketActions } from "@/components/admin/alert-ticket-actions";
import { KpiCards } from "@/components/admin/kpi-cards";
import { QueueStatusForm } from "@/components/admin/queue-status-form";
import { getAdminInbox } from "@/lib/admin/alerts";
import { firstParam, type SearchValues } from "@/lib/admin/params";
import {
  getAdminReports,
  getAdminSupportTickets,
  getClosedSupportTickets,
} from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import {
  alertKpis,
  ticketClosedAt,
  ticketResolutionMs,
} from "@/lib/ops/sla";
import { formatDuration } from "@/lib/ops/time";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/lib/support/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin alerts · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function AdminAlertsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = firstParam(params, "tab") === "closed" ? "closed" : "active";
  const [tickets, reports] = await Promise.all([
    getAdminSupportTickets(),
    getAdminReports(),
  ]);
  const kpis = alertKpis(tickets, reports);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Alerts</h2>
        <p className="text-sm text-muted-foreground">
          Active operational items. Closed tickets stay available to reopen.
        </p>
      </div>
      <KpiCards
        items={[
          { label: "Open Tickets", value: kpis.openTickets },
          { label: "Open Reports", value: kpis.openReports },
          { label: "Critical Tickets", value: kpis.criticalTickets },
          { label: "Resolved Today", value: kpis.resolvedToday },
          { label: "Average Resolution Time", value: kpis.averageResolution },
        ]}
      />
      <div className="flex gap-1 rounded-lg border border-border p-1">
        <Link
          href="/admin/alerts"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            tab === "active"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Active
        </Link>
        <Link
          href="/admin/alerts?tab=closed"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            tab === "closed"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Closed tickets
        </Link>
      </div>
      {tab === "closed" ? <ClosedTicketsTab /> : <ActiveAlertsTab />}
    </section>
  );
}

async function ActiveAlertsTab() {
  const inbox = await getAdminInbox();

  if (inbox.items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No open tickets or reports.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {inbox.items.map((item) => (
        <li key={item.id}>
          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {item.severity} · {item.source}
                </p>
                <p className="font-medium">{item.title}</p>
                {item.message ? (
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {formatDiscoverDate(item.created_at)}
                </p>
              </div>
              <AlertTicketActions
                href={item.href}
                source={item.source}
                entityId={item.id.replace(/^(ticket|report):/, "")}
                mode="resolve"
              />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

async function ClosedTicketsTab() {
  const tickets = await getClosedSupportTickets();

  if (tickets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No closed or resolved tickets.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tickets.map((ticket) => {
        const closedAt = ticketClosedAt(ticket);
        return (
          <li key={ticket.id} id={`ticket-${ticket.id}`}>
            <Card className="shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {SUPPORT_STATUS_LABELS[ticket.status]} ·{" "}
                    {SUPPORT_PRIORITY_LABELS[ticket.priority]}
                  </p>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {SUPPORT_CATEGORY_LABELS[ticket.category]}
                  </p>
                  <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>
                      Created At {formatDiscoverDate(ticket.created_at)}
                    </div>
                    <div>
                      Updated At{" "}
                      {formatDiscoverDate(ticket.updated_at || ticket.created_at)}
                    </div>
                    <div>Closed At {formatDiscoverDate(closedAt)}</div>
                    <div>
                      Resolution Time {formatDuration(ticketResolutionMs(ticket))}
                    </div>
                  </dl>
                </div>
                <AlertTicketActions
                  href={`/admin/support?ticket=${ticket.id}`}
                  source="ticket"
                  entityId={ticket.id}
                  mode="reopen"
                />
                <QueueStatusForm
                  kind="ticket"
                  id={ticket.id}
                  current={ticket.status}
                  notes={ticket.admin_reply}
                />
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

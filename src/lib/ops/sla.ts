import {
  average,
  elapsedMs,
  formatAverageDuration,
  isOnLocalDay,
} from "@/lib/ops/time";
import type { Report, SupportTicket } from "@/lib/supabase/types";

export function ticketClosedAt(ticket: SupportTicket) {
  if (ticket.closed_at) return ticket.closed_at;
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return ticket.updated_at || ticket.created_at;
  }
  return null;
}

export function ticketResolutionMs(ticket: SupportTicket) {
  const closed = ticketClosedAt(ticket);
  return closed ? elapsedMs(ticket.created_at, new Date(closed)) : null;
}

export function ticketFirstResponseMs(ticket: SupportTicket) {
  if (!ticket.first_response_at) return null;
  return elapsedMs(ticket.created_at, new Date(ticket.first_response_at));
}

export function supportSla(tickets: SupportTicket[]) {
  const resolution = tickets
    .map(ticketResolutionMs)
    .filter((value): value is number => value != null);
  const firstResponse = tickets
    .map(ticketFirstResponseMs)
    .filter((value): value is number => value != null);
  return {
    averageResolution: formatAverageDuration(average(resolution)),
    averageFirstResponse: formatAverageDuration(average(firstResponse)),
    openedToday: tickets.filter((ticket) => isOnLocalDay(ticket.created_at))
      .length,
    closedToday: tickets.filter((ticket) => isOnLocalDay(ticketClosedAt(ticket)))
      .length,
    resolvedToday: tickets.filter((ticket) => {
      const closed = ticketClosedAt(ticket);
      return (
        Boolean(closed) &&
        isOnLocalDay(closed) &&
        (ticket.status === "resolved" || ticket.status === "closed")
      );
    }).length,
  };
}

export function alertKpis(tickets: SupportTicket[], reports: Report[]) {
  const sla = supportSla(tickets);
  return {
    openTickets: tickets.filter(
      (ticket) => ticket.status === "open" || ticket.status === "assigned",
    ).length,
    openReports: reports.filter(
      (report) => report.status === "open" || report.status === "under_review",
    ).length,
    criticalTickets: tickets.filter(
      (ticket) =>
        ticket.priority === "critical" &&
        (ticket.status === "open" || ticket.status === "assigned"),
    ).length,
    resolvedToday: sla.resolvedToday,
    averageResolution: sla.averageResolution,
  };
}

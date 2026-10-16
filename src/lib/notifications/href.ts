import type { AppNotification } from "@/lib/supabase/types";

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractNotificationUuid(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(UUID_RE);
  return match ? match[0] : null;
}

function supportTicketId(item: AppNotification) {
  return (
    extractNotificationUuid(item.href) ??
    extractNotificationUuid(item.entity_id) ??
    extractNotificationUuid(item.source_id)
  );
}

export function notificationHref(item: AppNotification): string {
  if (item.type === "account_warned") return "/support/warning";

  const ticketId = supportTicketId(item);
  if (
    item.entity_type === "support_ticket" ||
    item.type === "support_ticket_updated" ||
    item.type === "support_ticket_resolved"
  ) {
    return ticketId ? `/support/${ticketId}` : "/support";
  }

  if (item.href && item.href !== "/support") return item.href;

  const id = item.entity_id;
  if (!id) return "/notifications";
  switch (item.entity_type) {
    case "validation_request":
      return `/validations/${id}`;
    case "review":
      return "/projects";
    case "project":
      return "/projects";
    case "user":
      return "/reputation";
    default:
      if (item.type === "validation_completed") return `/validations/${id}`;
      if (item.type === "review_received") return "/projects";
      if (item.type === "project_published") return "/projects";
      if (item.type === "project_score_updated") return "/projects";
      if (item.type === "reputation_increased") return "/reputation";
      if (
        item.type === "validation_opportunity" ||
        item.type === "validation_request_accepted" ||
        item.type === "validation_request_declined" ||
        item.type === "review_acknowledged"
      ) {
        return `/validations/${id}`;
      }
      if (item.type === "reputation_level_up") return "/reputation";
      return "/notifications";
  }
}

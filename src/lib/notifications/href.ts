import type { AppNotification } from "@/lib/supabase/types";

export function notificationHref(item: AppNotification): string {
  if (item.href) return item.href;
  const id = item.entity_id;
  if (!id) return "/notifications";
  switch (item.entity_type) {
    case "validation_request":
      return `/validations/${id}`;
    case "review":
      return `/validations/${id}`;
    case "project":
      return `/projects`;
    case "support_ticket":
      return `/support/${id}`;
    case "user":
      return "/reputation";
    default:
      if (item.type === "validation_completed") return `/validations/${id}`;
      if (item.type === "review_received") return `/validations/${id}`;
      if (item.type === "project_published") return "/projects";
      if (
        item.type === "support_ticket_updated" ||
        item.type === "support_ticket_resolved"
      ) {
        return `/support/${id}`;
      }
      if (item.type === "reputation_level_up") return "/reputation";
      if (item.type === "account_warned") return "/support";
      return "/notifications";
  }
}

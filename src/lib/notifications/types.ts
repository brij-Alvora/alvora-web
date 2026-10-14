export const NOTIFICATION_TYPES = [
  "review_received",
  "validation_completed",
  "reputation_level_up",
  "project_published",
  "support_ticket_updated",
  "support_ticket_resolved",
  "account_warned",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  review_received: "Review received",
  validation_completed: "Validation completed",
  reputation_level_up: "Reputation level up",
  project_published: "Project published",
  support_ticket_updated: "Support ticket updated",
  support_ticket_resolved: "Support ticket resolved",
  account_warned: "Account warning",
};

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isNotificationUnread(item: {
  is_read?: boolean;
  read_at?: string | null;
}) {
  if (typeof item.is_read === "boolean") return !item.is_read;
  return !item.read_at;
}

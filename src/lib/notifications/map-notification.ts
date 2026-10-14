import { isNotificationType } from "@/lib/notifications/types";
import type {
  AppNotification,
  NotificationEntityType,
} from "@/lib/supabase/types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asEntityType(value: unknown): NotificationEntityType | null {
  if (
    value === "user" ||
    value === "project" ||
    value === "review" ||
    value === "validation_request" ||
    value === "support_ticket"
  ) {
    return value;
  }
  return null;
}

export function mapNotification(
  row: Record<string, unknown> | null,
): AppNotification | null {
  if (!row) return null;
  const type = asString(row.type);
  const userId = asString(row.user_id);
  if (!isNotificationType(type) || !userId) return null;
  const message = asNullableString(row.message) ?? asNullableString(row.body);
  const entityId =
    asNullableString(row.entity_id) ?? asNullableString(row.source_id);
  const isRead =
    row.is_read === true ||
    (row.is_read !== false && asNullableString(row.read_at) != null);
  return {
    id: asString(row.id),
    user_id: userId,
    type,
    title: asString(row.title) || "Notification",
    message,
    body: asNullableString(row.body),
    href: asNullableString(row.href),
    entity_type: asEntityType(row.entity_type),
    entity_id: entityId,
    source_id: asNullableString(row.source_id),
    is_read: isRead,
    read_at: asNullableString(row.read_at),
    created_at: asString(row.created_at),
  };
}

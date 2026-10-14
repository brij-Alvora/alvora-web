import {
  isSupportCategory,
  isSupportPriority,
  isSupportStatus,
} from "@/lib/support/types";
import type { SupportTicket } from "@/lib/supabase/types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStatus(value: string) {
  if (value === "under_review") return "assigned";
  if (value === "dismissed") return "closed";
  return value;
}

export function mapSupportTicket(
  row: Record<string, unknown> | null,
): SupportTicket | null {
  if (!row) return null;
  const category = asString(row.category);
  const status = normalizeStatus(asString(row.status, "open"));
  const priority = asString(row.priority, "medium");
  const userId = asString(row.user_id);
  if (!isSupportCategory(category) || !isSupportStatus(status)) return null;
  if (!isSupportPriority(priority) || !userId) return null;
  const message = asString(row.description) || asString(row.message);
  return {
    id: asString(row.id),
    user_id: userId,
    category,
    priority,
    subject: asString(row.subject),
    message,
    description: asNullableString(row.description),
    status,
    admin_reply: asNullableString(row.admin_reply),
    assigned_admin_id: asNullableString(row.assigned_admin_id),
    first_response_at: asNullableString(row.first_response_at),
    closed_at: asNullableString(row.closed_at),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

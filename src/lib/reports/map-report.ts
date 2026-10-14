import {
  isReportQueueStatus,
  isReportTargetType,
} from "@/lib/reports/types";
import type { Report } from "@/lib/supabase/types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapReport(row: Record<string, unknown> | null): Report | null {
  if (!row) return null;
  const entityType = asString(row.entity_type) || asString(row.target_type);
  const entityId = asString(row.entity_id) || asString(row.target_id);
  const status = asString(row.status, "open");
  const reporterId = asString(row.reporter_id);
  if (!isReportTargetType(entityType) || !isReportQueueStatus(status)) {
    return null;
  }
  if (!reporterId || !entityId) return null;
  const description =
    asNullableString(row.description) ?? asNullableString(row.details);
  return {
    id: asString(row.id),
    reporter_id: reporterId,
    entity_type: entityType,
    entity_id: entityId,
    target_type: entityType,
    target_id: entityId,
    reason: asString(row.reason),
    description,
    details: asNullableString(row.details),
    status,
    admin_notes: asNullableString(row.admin_notes),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

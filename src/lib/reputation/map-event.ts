import { isReputationEventType } from "@/lib/reputation/rules";
import type { Json, ReputationEvent } from "@/lib/supabase/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asPoints(value: unknown): number | null {
  const points = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(points)) return null;
  return points;
}

function asMetadata(value: unknown): Json | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Json;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Json;
  return null;
}

export function mapReputationEvent(
  row: Record<string, unknown> | null,
): ReputationEvent | null {
  if (!row) return null;
  const eventType = asString(row.event_type);
  if (!isReputationEventType(eventType)) return null;
  const points = asPoints(row.points);
  const userId = asString(row.user_id);
  if (points == null || !userId) return null;

  return {
    id: asString(row.id),
    user_id: userId,
    event_type: eventType,
    points,
    source_id: asNullableString(row.source_id),
    metadata: asMetadata(row.metadata),
    created_at: asString(row.created_at),
  };
}

export function sumReputationPoints(events: ReputationEvent[]): number {
  return events.reduce((total, event) => total + event.points, 0);
}

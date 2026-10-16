import { mapReputationEvent } from "@/lib/reputation/map-event";
import {
  REPUTATION_POINTS,
  type ReputationEventType,
} from "@/lib/reputation/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export type ReputationMetadata = {
  project_id?: string;
  validation_id?: string;
  review_id?: string;
  owner_id?: string;
  reviewer_id?: string;
};

export async function insertReputationEvent(input: {
  userId: string;
  eventType: ReputationEventType;
  sourceId: string;
  metadata?: ReputationMetadata;
}): Promise<{ created: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("reputation_events")
    .select("id")
    .eq("event_type", input.eventType)
    .eq("source_id", input.sourceId)
    .maybeSingle();

  if (existingError) {
    console.error("[reputation] lookup failed", existingError.message);
    return { created: false, error: existingError.message };
  }
  if (existing) return { created: false };

  const payload = {
    user_id: input.userId,
    event_type: input.eventType,
    points: REPUTATION_POINTS[input.eventType],
    source_id: input.sourceId,
    metadata: (input.metadata ?? null) as Json | null,
  };

  const { data, error } = await admin
    .from("reputation_events")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[reputation] insert failed", error.message, error.details, payload);
    return { created: false, error: error.message };
  }

  if (!mapReputationEvent((data ?? null) as Record<string, unknown> | null)) {
    if (data) return { created: true };
    return { created: false, error: "Insert returned no row" };
  }

  return { created: true };
}

export async function countUserEvents(
  userId: string,
  eventType: ReputationEventType,
): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("reputation_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", eventType);
  if (error) {
    console.error("[reputation] count failed", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function countPairwiseReviewAwards(input: {
  reviewerId: string;
  ownerId: string;
  sinceIso: string;
}): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reputation_events")
    .select("id, metadata, created_at")
    .eq("user_id", input.reviewerId)
    .eq("event_type", "review_submitted")
    .gte("created_at", input.sinceIso);
  if (error || !Array.isArray(data)) return 0;
  return data.filter((row) => {
    const metadata = row.metadata;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return false;
    }
    return (
      "owner_id" in metadata &&
      metadata.owner_id === input.ownerId
    );
  }).length;
}

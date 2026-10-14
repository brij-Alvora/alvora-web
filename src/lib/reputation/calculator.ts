import {
  mapReputationEvent,
  sumReputationPoints,
} from "@/lib/reputation/map-event";
import {
  getReputationBand,
  progressToNextLevel,
} from "@/lib/reputation/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReputationEvent } from "@/lib/supabase/types";

export type ReputationSnapshot = {
  total_points: number;
  level: string;
  next_level: string | null;
  progress: number;
  events: ReputationEvent[];
};

export async function calculateReputation(
  userId: string,
): Promise<ReputationSnapshot> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reputation_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const events =
    error || !Array.isArray(data)
      ? []
      : data
          .map((row) => mapReputationEvent(row as Record<string, unknown>))
          .filter((row): row is ReputationEvent => row !== null);

  const total_points = sumReputationPoints(events);
  const band = getReputationBand(total_points);

  return {
    total_points,
    level: band.name,
    next_level: band.nextName,
    progress: progressToNextLevel(total_points, band.nextAt),
    events,
  };
}

import { mapProject } from "@/lib/project/map-project";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/supabase/types";

export type RecommendationContext = {
  userId: string;
  limit?: number;
};

export type RecommendationReason = "newest_not_owned";

export type RecommendationStrategy = (
  context: Required<RecommendationContext>,
) => Promise<Project[]>;

/**
 * MVP: published projects the current user does not own, newest first.
 * Swap or compose strategies here without changing Discover UI.
 */
const newestNotOwned: RecommendationStrategy = async ({ userId, limit }) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .neq("owner_id", userId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !Array.isArray(data)) return [];
  return data
    .map((row) => mapProject(row as Record<string, unknown>))
    .filter((row): row is Project => row !== null);
};

const activeStrategy: RecommendationStrategy = newestNotOwned;

export async function getRecommendedProjects(
  context: RecommendationContext,
): Promise<Project[]> {
  return activeStrategy({
    userId: context.userId,
    limit: context.limit ?? 6,
  });
}

export const RECOMMENDATION_REASON: RecommendationReason = "newest_not_owned";

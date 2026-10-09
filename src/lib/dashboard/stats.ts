import { countOwnerProjects } from "@/lib/project/queries";
import type { Profile } from "@/lib/supabase/types";

export type BuilderStats = {
  projects: number;
  validationRequests: number;
  reviews: number;
  reputation: number;
};

export async function getBuilderStats(
  profile: Profile | null,
  userId: string,
): Promise<BuilderStats> {
  const projects = await countOwnerProjects(userId);
  return {
    projects,
    validationRequests: 0,
    reviews: 0,
    reputation: profile?.reputation_score ?? 0,
  };
}

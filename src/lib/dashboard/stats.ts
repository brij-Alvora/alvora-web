import type { Profile } from "@/lib/supabase/types";

export type BuilderStats = {
  projects: number;
  validationRequests: number;
  reviews: number;
  reputation: number;
};

/**
 * Sprint 1 has no projects/validations/reviews tables yet.
 * Surface 0 until those sources exist. Reputation uses profiles.reputation_score.
 */
export function getBuilderStats(profile: Profile | null): BuilderStats {
  return {
    projects: 0,
    validationRequests: 0,
    reviews: 0,
    reputation: profile?.reputation_score ?? 0,
  };
}

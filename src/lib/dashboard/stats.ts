import { countOwnerProjects } from "@/lib/project/queries";
import {
  countReviewsReceived,
  countReviewsSubmitted,
} from "@/lib/review/queries";
import type { Profile } from "@/lib/supabase/types";
import { countMyValidationRequests } from "@/lib/validation/queries";

export type BuilderStats = {
  projects: number;
  validationRequests: number;
  reviewsReceived: number;
  reviewsSubmitted: number;
  reputation: number;
};

export async function getBuilderStats(
  profile: Profile | null,
  userId: string,
): Promise<BuilderStats> {
  const [projects, validationRequests, reviewsReceived, reviewsSubmitted] =
    await Promise.all([
      countOwnerProjects(userId),
      countMyValidationRequests(userId),
      countReviewsReceived(userId),
      countReviewsSubmitted(userId),
    ]);
  return {
    projects,
    validationRequests,
    reviewsReceived,
    reviewsSubmitted,
    reputation: profile?.reputation_score ?? 0,
  };
}

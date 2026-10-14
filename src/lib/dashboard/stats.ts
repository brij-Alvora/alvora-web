import { countOwnerProjects } from "@/lib/project/queries";
import { calculateReputation } from "@/lib/reputation/calculator";
import type { ReputationSnapshot } from "@/lib/reputation/calculator";
import {
  countReviewsReceived,
  countReviewsSubmitted,
} from "@/lib/review/queries";
import { countMyValidationRequests } from "@/lib/validation/queries";

export type BuilderStats = {
  projects: number;
  validationRequests: number;
  reviewsReceived: number;
  reviewsSubmitted: number;
  reputation: ReputationSnapshot;
};

export async function getBuilderStats(userId: string): Promise<BuilderStats> {
  const [projects, validationRequests, reviewsReceived, reviewsSubmitted, reputation] =
    await Promise.all([
      countOwnerProjects(userId),
      countMyValidationRequests(userId),
      countReviewsReceived(userId),
      countReviewsSubmitted(userId),
      calculateReputation(userId),
    ]);
  return {
    projects,
    validationRequests,
    reviewsReceived,
    reviewsSubmitted,
    reputation,
  };
}

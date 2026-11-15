import { countOwnerProjects } from "@/lib/project/queries";
import {
  calculateReputation,
  emptyReputationSnapshot,
} from "@/lib/reputation/calculator";
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

const emptyStats = (): BuilderStats => ({
  projects: 0,
  validationRequests: 0,
  reviewsReceived: 0,
  reviewsSubmitted: 0,
  reputation: emptyReputationSnapshot(),
});

export async function getBuilderStats(userId: string): Promise<BuilderStats> {
  try {
    const [projects, validationRequests, reviewsReceived, reviewsSubmitted, reputation] =
      await Promise.all([
        countOwnerProjects(userId).catch(() => 0),
        countMyValidationRequests(userId).catch(() => 0),
        countReviewsReceived(userId).catch(() => 0),
        countReviewsSubmitted(userId).catch(() => 0),
        calculateReputation(userId),
      ]);
    return {
      projects,
      validationRequests,
      reviewsReceived,
      reviewsSubmitted,
      reputation,
    };
  } catch (error) {
    console.error("[dashboard] getBuilderStats failed", error);
    return emptyStats();
  }
}

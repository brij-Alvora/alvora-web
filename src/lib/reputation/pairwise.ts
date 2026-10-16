export const PAIRWISE_REVIEW_LIMIT = 2;
export const PAIRWISE_WINDOW_DAYS = 90;
export const PAIRWISE_WINDOW_MS = PAIRWISE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type PairwiseEvent = {
  reviewer_id: string;
  owner_id: string;
  created_at: string;
};

export function countPairwiseScoringReviews(input: {
  reviewerId: string;
  ownerId: string;
  events: PairwiseEvent[];
  now?: number;
}) {
  const cutoff = (input.now ?? Date.now()) - PAIRWISE_WINDOW_MS;
  return input.events.filter((event) => {
    if (event.reviewer_id !== input.reviewerId) return false;
    if (event.owner_id !== input.ownerId) return false;
    const created = Date.parse(event.created_at);
    return Number.isFinite(created) && created > cutoff;
  }).length;
}

export function canAwardPairwiseReview(input: {
  reviewerId: string;
  ownerId: string;
  events: PairwiseEvent[];
  now?: number;
}) {
  if (!input.reviewerId || !input.ownerId) return false;
  if (input.reviewerId === input.ownerId) return false;
  return (
    countPairwiseScoringReviews(input) < PAIRWISE_REVIEW_LIMIT
  );
}

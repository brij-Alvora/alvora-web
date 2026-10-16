export const REVIEW_EDIT_WINDOW_MS = 15 * 60 * 1000;

export type IndependentReviewInput = {
  reviewer_id: string;
  moderation_status: string;
};

export function isIndependentReviewer(input: {
  reviewerId: string;
  ownerId: string | null | undefined;
  requestedBy: string | null | undefined;
}) {
  if (!input.reviewerId) return false;
  if (input.ownerId && input.reviewerId === input.ownerId) return false;
  if (input.requestedBy && input.reviewerId === input.requestedBy) return false;
  return true;
}

export function canReviewProject(input: {
  reviewerId: string;
  ownerId: string | null | undefined;
  requestedBy: string | null | undefined;
}) {
  return isIndependentReviewer(input);
}

export function isVisibleModeration(status: string | null | undefined) {
  return status === "visible" || status == null || status === "";
}

export function countIndependentVisibleReviews(input: {
  reviews: IndependentReviewInput[];
  ownerId: string | null | undefined;
  requestedBy: string | null | undefined;
}) {
  return input.reviews.filter(
    (review) =>
      isVisibleModeration(review.moderation_status) &&
      isIndependentReviewer({
        reviewerId: review.reviewer_id,
        ownerId: input.ownerId,
        requestedBy: input.requestedBy,
      }),
  ).length;
}

export function canCompleteValidation(input: {
  reviews: IndependentReviewInput[];
  ownerId: string | null | undefined;
  requestedBy: string | null | undefined;
}) {
  return countIndependentVisibleReviews(input) >= 1;
}

export function isReviewEditWindowOpen(
  createdAt: string | Date,
  now = Date.now(),
) {
  const created =
    createdAt instanceof Date ? createdAt.getTime() : Date.parse(createdAt);
  if (!Number.isFinite(created)) return false;
  return now - created < REVIEW_EDIT_WINDOW_MS;
}

export function memberCanReadReview(input: {
  readerId: string;
  reviewerId: string;
  moderationStatus: string;
}) {
  if (isVisibleModeration(input.moderationStatus)) return true;
  return input.readerId === input.reviewerId;
}

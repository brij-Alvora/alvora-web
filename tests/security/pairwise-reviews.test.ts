import { describe, expect, it } from "vitest";

import {
  canAwardPairwiseReview,
  PAIRWISE_REVIEW_LIMIT,
} from "@/lib/reputation/pairwise";

describe("pairwise review farming cap", () => {
  const now = Date.parse("2026-10-16T00:00:00Z");
  const recent = "2026-10-01T00:00:00Z";
  const old = "2026-01-01T00:00:00Z";

  it("awards the first two directed reviews in 90 days", () => {
    const events = [
      { reviewer_id: "a", owner_id: "b", created_at: recent },
    ];
    expect(
      canAwardPairwiseReview({
        reviewerId: "a",
        ownerId: "b",
        events,
        now,
      }),
    ).toBe(true);
    events.push({ reviewer_id: "a", owner_id: "b", created_at: recent });
    expect(
      canAwardPairwiseReview({
        reviewerId: "a",
        ownerId: "b",
        events,
        now,
      }),
    ).toBe(false);
    expect(PAIRWISE_REVIEW_LIMIT).toBe(2);
  });

  it("ignores reviews outside the rolling window", () => {
    expect(
      canAwardPairwiseReview({
        reviewerId: "a",
        ownerId: "b",
        events: [
          { reviewer_id: "a", owner_id: "b", created_at: old },
          { reviewer_id: "a", owner_id: "b", created_at: old },
        ],
        now,
      }),
    ).toBe(true);
  });

  it("does not count the reverse direction toward the same cap", () => {
    expect(
      canAwardPairwiseReview({
        reviewerId: "a",
        ownerId: "b",
        events: [
          { reviewer_id: "b", owner_id: "a", created_at: recent },
          { reviewer_id: "b", owner_id: "a", created_at: recent },
        ],
        now,
      }),
    ).toBe(true);
  });
});

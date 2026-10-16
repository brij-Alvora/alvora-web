import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { captchaRequired } from "@/lib/auth/captcha";
import { isEmailConfirmed } from "@/lib/auth/email-confirmed";
import {
  AUTH_RATE_LIMITS,
  isRateLimited,
} from "@/lib/auth/rate-limit";
import { sumReputationPoints } from "@/lib/reputation/map-event";
import { REPUTATION_POINTS } from "@/lib/reputation/rules";
import {
  canCompleteValidation,
  canReviewProject,
  isReviewEditWindowOpen,
  memberCanReadReview,
  REVIEW_EDIT_WINDOW_MS,
} from "@/lib/security/review-rules";
import type { ReputationEvent } from "@/lib/supabase/types";

const SQL = readFileSync(
  path.resolve("supabase/migrations/20261016_security_hardening.sql"),
  "utf8",
);

describe("validation completion", () => {
  it("requires a visible independent review in SQL and application rules", () => {
    expect(SQL).toContain("validation_has_independent_review");
    expect(SQL).toContain("enforce_validation_completion");
    expect(SQL).toContain(
      "Validation cannot be completed without an independent visible review",
    );

    const owner = "owner-1";
    const requester = "req-1";
    expect(
      canCompleteValidation({
        ownerId: owner,
        requestedBy: requester,
        reviews: [],
      }),
    ).toBe(false);
    expect(
      canCompleteValidation({
        ownerId: owner,
        requestedBy: requester,
        reviews: [{ reviewer_id: owner, moderation_status: "visible" }],
      }),
    ).toBe(false);
    expect(
      canCompleteValidation({
        ownerId: owner,
        requestedBy: requester,
        reviews: [{ reviewer_id: "validator-1", moderation_status: "hidden" }],
      }),
    ).toBe(false);
    expect(
      canCompleteValidation({
        ownerId: owner,
        requestedBy: requester,
        reviews: [{ reviewer_id: "validator-1", moderation_status: "visible" }],
      }),
    ).toBe(true);
  });
});

describe("owner reviews", () => {
  it("blocks project owners and requesters in SQL and app rules", () => {
    expect(SQL).toContain("prevent_owner_and_self_reviews");
    expect(SQL).toContain("Project owners cannot review their own projects");
    expect(
      canReviewProject({
        reviewerId: "owner-1",
        ownerId: "owner-1",
        requestedBy: "other",
      }),
    ).toBe(false);
    expect(
      canReviewProject({
        reviewerId: "req-1",
        ownerId: "owner-1",
        requestedBy: "req-1",
      }),
    ).toBe(false);
    expect(
      canReviewProject({
        reviewerId: "validator-1",
        ownerId: "owner-1",
        requestedBy: "req-1",
      }),
    ).toBe(true);
  });
});

describe("hidden reviews", () => {
  it("limits SELECT to visible rows or the author", () => {
    expect(SQL).toContain("moderation_status = 'visible'");
    expect(SQL).toContain("OR reviewer_id = auth.uid()");
    expect(
      memberCanReadReview({
        readerId: "a",
        reviewerId: "b",
        moderationStatus: "hidden",
      }),
    ).toBe(false);
    expect(
      memberCanReadReview({
        readerId: "b",
        reviewerId: "b",
        moderationStatus: "flagged",
      }),
    ).toBe(true);
    expect(
      memberCanReadReview({
        readerId: "a",
        reviewerId: "b",
        moderationStatus: "visible",
      }),
    ).toBe(true);
  });
});

describe("review freeze window", () => {
  it("locks member updates after 15 minutes", () => {
    expect(SQL).toContain("interval '15 minutes'");
    expect(SQL).toContain("enforce_review_immutability");
    const created = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const expired = new Date(
      Date.now() - (REVIEW_EDIT_WINDOW_MS + 1000),
    ).toISOString();
    expect(isReviewEditWindowOpen(created)).toBe(true);
    expect(isReviewEditWindowOpen(expired)).toBe(false);
  });
});

describe("reputation clawback", () => {
  it("nets to zero when a review is retracted", () => {
    const events = [
      { points: REPUTATION_POINTS.review_submitted },
      { points: REPUTATION_POINTS.review_retracted },
      { points: REPUTATION_POINTS.validation_completed },
      { points: REPUTATION_POINTS.validation_completed_retracted },
    ] as ReputationEvent[];
    expect(sumReputationPoints(events)).toBe(0);
    expect(REPUTATION_POINTS.review_retracted).toBe(-15);
    expect(REPUTATION_POINTS.validation_completed_retracted).toBe(-20);
  });
});

describe("auth launch blockers", () => {
  it("treats missing email_confirmed_at as unconfirmed", () => {
    expect(isEmailConfirmed({ email_confirmed_at: null })).toBe(false);
    expect(
      isEmailConfirmed({ email_confirmed_at: "2026-01-01T00:00:00Z" }),
    ).toBe(true);
  });

  it("rate-limits login after the configured window fills", () => {
    const now = 1_000_000;
    const { limit, windowMs } = AUTH_RATE_LIMITS.login;
    const stamps = Array.from({ length: limit }, (_, i) => now - i * 1000);
    expect(isRateLimited(stamps, limit, windowMs, now)).toBe(true);
    expect(isRateLimited(stamps.slice(1), limit, windowMs, now)).toBe(false);
  });

  it("requires CAPTCHA in production", () => {
    expect(captchaRequired("production")).toBe(true);
  });
});

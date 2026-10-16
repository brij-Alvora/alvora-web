import { describe, expect, it } from "vitest";

import {
  allowedManualValidationStatuses,
  canManuallySetValidationStatus,
} from "@/lib/security/validation-status";

describe("validation status lock", () => {
  it("blocks completed → open", () => {
    expect(
      canManuallySetValidationStatus({
        from: "completed",
        to: "open",
        hasIndependentReview: true,
      }),
    ).toBe(false);
  });

  it("hides Open from completed validations", () => {
    expect(
      allowedManualValidationStatuses("completed", true),
    ).toEqual(["completed"]);
  });

  it("allows completed → in_review only when qualifying reviews are gone", () => {
    expect(
      canManuallySetValidationStatus({
        from: "completed",
        to: "in_review",
        hasIndependentReview: false,
      }),
    ).toBe(true);
    expect(
      canManuallySetValidationStatus({
        from: "completed",
        to: "in_review",
        hasIndependentReview: true,
      }),
    ).toBe(false);
  });
});

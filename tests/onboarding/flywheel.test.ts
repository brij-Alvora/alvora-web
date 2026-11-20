import { describe, expect, it } from "vitest";

import {
  continueAfterProfile,
  flywheelSteps,
  nextFlywheelStep,
  parseFlywheelIntent,
  registerHref,
  resolveAfterAuth,
  type FlywheelProgress,
} from "@/lib/onboarding/flywheel";

function progress(
  overrides: Partial<FlywheelProgress> = {},
): FlywheelProgress {
  return {
    intent: "builder",
    profileComplete: false,
    hasPublishedProject: false,
    hasValidationRequest: false,
    hasSubmittedReview: false,
    isFoundingMentor: false,
    ...overrides,
  };
}

describe("flywheel routing", () => {
  it("defaults unknown intent to builder", () => {
    expect(parseFlywheelIntent(undefined)).toBe("builder");
    expect(parseFlywheelIntent("reviewer")).toBe("reviewer");
    expect(registerHref("builder")).toBe("/register?intent=builder");
  });

  it("routes builders profile → publish → request validation", () => {
    const start = progress();
    expect(nextFlywheelStep(start)?.id).toBe("profile");
    expect(
      nextFlywheelStep(progress({ profileComplete: true }))?.href,
    ).toBe("/projects/new");
    expect(
      nextFlywheelStep(
        progress({ profileComplete: true, hasPublishedProject: true }),
      )?.href,
    ).toBe("/validations/new");
    expect(
      nextFlywheelStep(
        progress({
          profileComplete: true,
          hasPublishedProject: true,
          hasValidationRequest: true,
        }),
      ),
    ).toBeNull();
    expect(continueAfterProfile("builder")).toBe("/projects/new");
  });

  it("routes reviewers profile → queue → first review", () => {
    const steps = flywheelSteps(progress({ intent: "reviewer" }));
    expect(steps.map((step) => step.id)).toEqual(["profile", "queue", "review"]);
    expect(continueAfterProfile("reviewer")).toBe("/validations");
    expect(
      nextFlywheelStep(
        progress({ intent: "reviewer", profileComplete: true }),
      )?.href,
    ).toBe("/validations");
  });

  it("treats Founding Mentors as reviewers", () => {
    expect(
      nextFlywheelStep(
        progress({
          isFoundingMentor: true,
          profileComplete: true,
        }),
      )?.href,
    ).toBe("/validations");
  });

  it("honors an explicit next path and ignores a generic dashboard next", () => {
    const start = progress();
    expect(
      resolveAfterAuth({
        explicitNext: "/validations/new?project_id=abc",
        progress: start,
      }),
    ).toBe("/validations/new?project_id=abc");
    expect(
      resolveAfterAuth({ explicitNext: "/dashboard", progress: start }),
    ).toBe("/profile/edit");
  });
});

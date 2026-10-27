import { describe, expect, it } from "vitest";

import { hasUtm, mergeFirstTouch, parseUtmSearch } from "@/lib/analytics/utm";
import { isMentorProfileComplete } from "@/lib/analytics/events";
import { buildFunnelSteps } from "@/lib/analytics/funnel";

describe("UTM capture", () => {
  it("parses campaign parameters from a query string", () => {
    const utm = parseUtmSearch(
      "?utm_source=email&utm_medium=invite&utm_campaign=beta-cohort-2026&utm_content=founding",
    );
    expect(utm.utm_source).toBe("email");
    expect(utm.utm_medium).toBe("invite");
    expect(utm.utm_campaign).toBe("beta-cohort-2026");
    expect(utm.utm_content).toBe("founding");
    expect(hasUtm(utm)).toBe(true);
  });

  it("keeps first-touch values when a later click has new UTMs", () => {
    const first = parseUtmSearch("utm_source=email&utm_campaign=invite");
    const later = parseUtmSearch("utm_source=twitter&utm_campaign=ads");
    expect(mergeFirstTouch(first, later).utm_source).toBe("email");
    expect(mergeFirstTouch(null, later).utm_source).toBe("twitter");
  });
});

describe("mentor profile completion for acquisition", () => {
  it("requires expertise and a mentor statement", () => {
    expect(
      isMentorProfileComplete({
        expertise: ["Product"],
        mentor_statement: "I review early products for readiness.",
      }),
    ).toBe(true);
    expect(
      isMentorProfileComplete({
        expertise: [],
        mentor_statement: "I review early products for readiness.",
      }),
    ).toBe(false);
  });
});

describe("mentor funnel math", () => {
  it("computes drop-off against the first step", () => {
    const steps = buildFunnelSteps([
      { key: "viewed", label: "Viewed", value: 100 },
      { key: "continue", label: "Continue", value: 40 },
      { key: "approved", label: "Approved", value: 10 },
    ]);
    expect(steps[1]?.percentOfSignup).toBe(40);
    expect(steps[1]?.percentOfPrevious).toBe(40);
    expect(steps[2]?.percentOfSignup).toBe(10);
    expect(steps[2]?.percentOfPrevious).toBe(25);
  });
});

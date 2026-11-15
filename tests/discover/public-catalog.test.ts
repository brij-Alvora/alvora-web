import { describe, expect, it } from "vitest";

import {
  parseDiscoverTab,
  reviewSummaryText,
} from "@/lib/discover/presentation";

describe("public Discover catalog helpers", () => {
  it("defaults unknown tabs to mentors", () => {
    expect(parseDiscoverTab("")).toBe("mentors");
    expect(parseDiscoverTab("mentors")).toBe("mentors");
    expect(parseDiscoverTab("projects")).toBe("projects");
    expect(parseDiscoverTab("builders")).toBe("mentors");
  });

  it("prefers the written review body for the public summary", () => {
    expect(
      reviewSummaryText({
        review_text: "The demo holds for a first-time user.",
        what_works_well: "Clear onboarding.",
        recommendations: "Ship the empty state.",
      }),
    ).toBe("The demo holds for a first-time user.");
  });
});

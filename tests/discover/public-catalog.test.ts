import { describe, expect, it } from "vitest";

import {
  catalogMeetsTrendingQuality,
  dedupeMentors,
  dedupeProjects,
  isPlaceholderPerson,
  isPlaceholderProject,
  meetsFoundingShowcaseBar,
  thumbnailMonogram,
  TRENDING_MIN_QUALITY,
} from "@/lib/discover/catalog-quality";
import {
  filterMentors,
  filterProjects,
  projectMatchesCategory,
  sortProjects,
} from "@/lib/discover/filters";
import {
  parseDiscoverTab,
  parseHeadlineParts,
  parseProjectSort,
  reviewSummaryText,
} from "@/lib/discover/presentation";
import type { DiscoverProjectProof } from "@/lib/discover/queries";

describe("public Discover catalog helpers", () => {
  it("defaults unknown tabs to projects", () => {
    expect(parseDiscoverTab("")).toBe("projects");
    expect(parseDiscoverTab("mentors")).toBe("mentors");
    expect(parseDiscoverTab("projects")).toBe("projects");
    expect(parseDiscoverTab("builders")).toBe("projects");
  });

  it("parses headline title and company", () => {
    expect(parseHeadlineParts("Product lead at Acme")).toEqual({
      title: "Product lead",
      company: "Acme",
    });
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

function proof(
  overrides: Partial<DiscoverProjectProof> & Pick<DiscoverProjectProof, "title">,
): DiscoverProjectProof {
  return {
    id: overrides.title,
    owner_id: "owner",
    slug: overrides.title,
    short_description: "A public product",
    description: null,
    category: "SaaS",
    tags: ["AI"],
    github_url: null,
    demo_url: null,
    thumbnail_url: null,
    status: "published",
    validation_score: 0,
    published_at: "2026-11-01T00:00:00.000Z",
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    builder: null,
    reviewStatus: "reviewed",
    reviewerName: null,
    reviewerUsername: null,
    reviewSummary: null,
    reviewCount: 1,
    averageRating: 4,
    mentorCount: 1,
    featured: false,
    ...overrides,
  };
}

describe("marketplace filters", () => {
  it("matches category aliases from tags", () => {
    const project = proof({ title: "Agent", category: null, tags: ["LLM"] });
    expect(projectMatchesCategory(project, "AI")).toBe(true);
    expect(projectMatchesCategory(project, "Fintech")).toBe(false);
  });

  it("filters and sorts projects without inventing rows", () => {
    const rows = [
      proof({ title: "Alpha", reviewCount: 2, published_at: "2026-11-02T00:00:00.000Z" }),
      proof({
        title: "Beta",
        category: "Healthcare",
        tags: [],
        reviewCount: 5,
        published_at: "2026-10-01T00:00:00.000Z",
      }),
    ];
    expect(filterProjects(rows, "alpha", "").map((row) => row.title)).toEqual(["Alpha"]);
    expect(sortProjects(rows, "most_reviewed")[0].title).toBe("Beta");
    expect(parseProjectSort("newest")).toBe("newest");
  });

  it("keeps mentor search on real profile fields", () => {
    expect(
      filterMentors(
        [],
        "nobody",
        "Product",
      ),
    ).toEqual([]);
  });
});

describe("public catalog quality", () => {
  it("drops e2e, demo, and placeholder people", () => {
    expect(
      isPlaceholderPerson({ username: "validator-a", full_name: "Validator A" }),
    ).toBe(true);
    expect(
      isPlaceholderPerson({ username: "brij", full_name: "Brij" }),
    ).toBe(false);
    expect(
      isPlaceholderPerson({
        username: "alvora-reviewer",
        full_name: "Alvora Reviewer",
      }),
    ).toBe(true);
    expect(
      isPlaceholderPerson({ username: "test-user-2", full_name: "Test User 2" }),
    ).toBe(true);
  });

  it("drops placeholder projects including those owned by QA builders", () => {
    expect(
      isPlaceholderProject({
        title: "Status lock verification",
        slug: "status-lock-verification",
        builder: { username: "builder", full_name: "Builder" },
      }),
    ).toBe(true);
    expect(
      isPlaceholderProject({
        title: "Pulse Board Live",
        slug: "pulse-board-live",
        builder: { username: "builder-a", full_name: "Builder A" },
      }),
    ).toBe(true);
    expect(
      isPlaceholderProject({
        title: "Alvora",
        slug: "alvora",
        builder: { username: "brij", full_name: "Brij" },
      }),
    ).toBe(false);
  });

  it("dedupes projects by slug and owner+title, keeping the stronger proof", () => {
    const rows = dedupeProjects([
      proof({
        id: "a",
        title: "Pulse Board Live",
        slug: "pulse-board-live",
        reviewCount: 1,
      }),
      proof({
        id: "b",
        title: "Pulse Board Live",
        slug: "pulse-board-live",
        reviewCount: 4,
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("b");
  });

  it("dedupes mentors by username and prefers Founding Mentors with reviews", () => {
    const mentors = dedupeMentors([
      {
        reviewsGiven: 2,
        profile: {
          id: "1",
          user_id: "u1",
          username: "brij",
          is_founding_mentor: false,
        },
      },
      {
        reviewsGiven: 2,
        profile: {
          id: "2",
          user_id: "u1",
          username: "brij",
          is_founding_mentor: true,
        },
      },
    ]);
    expect(mentors).toHaveLength(1);
    expect(mentors[0].profile.is_founding_mentor).toBe(true);
  });

  it("does not treat a Founding Mentor with zero reviews as public proof", () => {
    expect(
      meetsFoundingShowcaseBar({
        reviewsGiven: 0,
        profile: { is_founding_mentor: true },
      }),
    ).toBe(false);
    expect(
      meetsFoundingShowcaseBar({
        reviewsGiven: 1,
        profile: { is_founding_mentor: true },
      }),
    ).toBe(true);
  });

  it("hides homepage Trending below the quality threshold", () => {
    expect(
      catalogMeetsTrendingQuality(
        {
          projects: [{ reviewCount: 2 }, { reviewCount: 0 }],
          mentors: [{ reviewsGiven: 2 }],
        },
        TRENDING_MIN_QUALITY,
      ),
    ).toBe(false);
    expect(
      catalogMeetsTrendingQuality(
        {
          projects: [
            { reviewCount: 2 },
            { reviewCount: 2 },
            { reviewCount: 2 },
          ],
          mentors: [
            { reviewsGiven: 2 },
            { reviewsGiven: 2 },
            { reviewsGiven: 2 },
          ],
        },
        TRENDING_MIN_QUALITY,
      ),
    ).toBe(true);
  });

  it("builds a monogram instead of empty-thumbnail copy", () => {
    expect(thumbnailMonogram("Alvora")).toBe("AL");
    expect(thumbnailMonogram("Pulse Board Live")).toBe("PB");
  });
});

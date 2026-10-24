import { describe, expect, it } from "vitest";

import { summarizeMentorContributions } from "@/lib/mentors/contributions";

describe("summarizeMentorContributions", () => {
  it("counts distinct projects, other builders, and completed validations", () => {
    const metrics = summarizeMentorContributions({
      mentorIds: ["mentor-1"],
      reviews: [
        { projectId: "project-a", validationRequestId: "request-1" },
        { projectId: "project-a", validationRequestId: "request-2" },
        { projectId: "project-b", validationRequestId: null },
        { projectId: "own-project", validationRequestId: "request-3" },
      ],
      projectOwners: new Map([
        ["project-a", "builder-a"],
        ["project-b", "builder-b"],
        ["own-project", "mentor-1"],
      ]),
      completedRequestIds: new Set(["request-1", "request-3"]),
    });

    expect(metrics).toEqual({
      reviewsContributed: 4,
      projectsReviewed: 3,
      buildersHelped: 2,
      validationsCompleted: 2,
    });
  });

  it("returns zeros when the mentor has no reviews", () => {
    expect(
      summarizeMentorContributions({
        mentorIds: ["mentor-1"],
        reviews: [],
        projectOwners: new Map(),
        completedRequestIds: new Set(),
      }),
    ).toEqual({
      reviewsContributed: 0,
      projectsReviewed: 0,
      buildersHelped: 0,
      validationsCompleted: 0,
    });
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { canReviewProject } from "@/lib/security/review-rules";
import {
  AVATAR_STORAGE_BUCKET,
  AVATAR_STORAGE_FORBIDDEN_MEMBER_COMMANDS,
  AVATAR_STORAGE_POLICY_SPEC,
  memberCanReadAvatarObject,
  memberCanWriteAvatarObject,
} from "@/lib/security/storage-policies";
import {
  applyValidationScoreLock,
  legacyMemberCanInsertReview,
  legacyMemberCanInsertValidationRequest,
  legacyMemberCanSelectValidationRequest,
  memberCanInsertReview,
  memberCanInsertValidationRequest,
  memberCanSelectValidationRequest,
  memberCanUpdateValidationScore,
} from "@/lib/security/trust-boundaries";

const SQL = readFileSync(
  path.resolve(
    "supabase/migrations/20261122_security_p0_trust_boundaries.sql",
  ),
  "utf8",
);

const STORAGE_SQL = readFileSync(
  path.resolve("supabase/migrations/20261122_storage_avatars_policies.sql"),
  "utf8",
);

const OWNER = "owner-1";
const REVIEWER = "reviewer-1";
const STRANGER = "stranger-1";
const PROJECT = "project-1";
const REQUEST = "request-1";

describe("P0 SQL ships the trust-boundary locks", () => {
  it("narrows validation_requests SELECT to requester, owner, or published queue", () => {
    expect(SQL).toContain(
      "Members can read own or published-project validation requests",
    );
    expect(SQL).toContain("auth.uid() = requested_by");
    expect(SQL).toContain("p.owner_id = auth.uid()");
    expect(SQL).toContain("p.status = 'published'");
    expect(SQL).not.toContain("USING (auth.uid() IS NOT NULL)");
  });

  it("requires project ownership on validation_requests INSERT", () => {
    expect(SQL).toContain(
      "Owners can create validation requests for own projects",
    );
    expect(SQL).toContain("auth.uid() = requested_by");
    expect(SQL).toContain("p.owner_id = auth.uid()");
  });

  it("rejects orphan reviews and unpublished projects on INSERT", () => {
    expect(SQL).toContain("validation_request_id IS NOT NULL");
    expect(SQL).toContain("vr.project_id = project_id");
    expect(SQL).toContain("p.status = 'published'");
    expect(SQL).toContain("enforce_review_request_integrity");
    expect(SQL).toContain("Reviews must belong to a validation request");
    expect(SQL).toContain("Reviews are only allowed on published projects");
  });

  it("locks projects.validation_score for members", () => {
    expect(SQL).toContain("protect_project_validation_score");
    expect(SQL).toContain("NEW.validation_score := OLD.validation_score");
    expect(SQL).toContain("GRANT UPDATE (");
    expect(SQL).not.toMatch(/GRANT UPDATE \([^)]*validation_score/);
  });
});

describe("attack scenarios: validation_requests SELECT", () => {
  const draftBrief = {
    requestedBy: OWNER,
    projectOwnerId: OWNER,
    projectStatus: "draft" as const,
  };

  it("before: any signed-in user could read a draft validation brief", () => {
    expect(
      legacyMemberCanSelectValidationRequest({
        ...draftBrief,
        readerId: STRANGER,
      }),
    ).toBe(true);
  });

  it("after: strangers cannot read draft briefs; owner still can", () => {
    expect(
      memberCanSelectValidationRequest({
        ...draftBrief,
        readerId: STRANGER,
      }),
    ).toBe(false);
    expect(
      memberCanSelectValidationRequest({
        ...draftBrief,
        readerId: OWNER,
      }),
    ).toBe(true);
  });

  it("after: published-project queue remains visible to reviewers", () => {
    expect(
      memberCanSelectValidationRequest({
        readerId: REVIEWER,
        requestedBy: OWNER,
        projectOwnerId: OWNER,
        projectStatus: "published",
      }),
    ).toBe(true);
  });

  it("after: anonymous still cannot read the queue", () => {
    expect(
      memberCanSelectValidationRequest({
        readerId: null,
        requestedBy: OWNER,
        projectOwnerId: OWNER,
        projectStatus: "published",
      }),
    ).toBe(false);
  });
});

describe("attack scenarios: validation_requests INSERT", () => {
  it("before: a stranger could attach a request to someone else's project", () => {
    expect(
      legacyMemberCanInsertValidationRequest({
        actorId: STRANGER,
        requestedBy: STRANGER,
        projectOwnerId: OWNER,
      }),
    ).toBe(true);
  });

  it("after: only the owner can open a request, as themselves", () => {
    expect(
      memberCanInsertValidationRequest({
        actorId: STRANGER,
        requestedBy: STRANGER,
        projectOwnerId: OWNER,
      }),
    ).toBe(false);
    expect(
      memberCanInsertValidationRequest({
        actorId: OWNER,
        requestedBy: STRANGER,
        projectOwnerId: OWNER,
      }),
    ).toBe(false);
    expect(
      memberCanInsertValidationRequest({
        actorId: OWNER,
        requestedBy: OWNER,
        projectOwnerId: OWNER,
      }),
    ).toBe(true);
  });
});

describe("attack scenarios: reviews INSERT", () => {
  const independent = {
    reviewerId: REVIEWER,
    ownerId: OWNER,
    requestedBy: OWNER,
  };

  it("before: orphan reviews (null request) and unpublished targets were allowed", () => {
    expect(
      legacyMemberCanInsertReview({
        ...independent,
        projectStatus: "draft",
        projectId: PROJECT,
        validationRequestId: null,
        requestProjectId: PROJECT,
      }),
    ).toBe(true);
  });

  it("after: orphan reviews are rejected", () => {
    expect(
      memberCanInsertReview({
        ...independent,
        projectStatus: "published",
        projectId: PROJECT,
        validationRequestId: null,
        requestProjectId: PROJECT,
      }),
    ).toBe(false);
  });

  it("after: a request for a different project cannot be attached", () => {
    expect(
      memberCanInsertReview({
        ...independent,
        projectStatus: "published",
        projectId: PROJECT,
        validationRequestId: REQUEST,
        requestProjectId: "other-project",
      }),
    ).toBe(false);
  });

  it("after: unpublished projects cannot receive reviews", () => {
    expect(
      memberCanInsertReview({
        ...independent,
        projectStatus: "draft",
        projectId: PROJECT,
        validationRequestId: REQUEST,
        requestProjectId: PROJECT,
      }),
    ).toBe(false);
    expect(
      canReviewProject({
        ...independent,
        projectStatus: "draft",
      }),
    ).toBe(false);
  });

  it("after: an independent reviewer can still review a published request", () => {
    expect(
      memberCanInsertReview({
        ...independent,
        projectStatus: "published",
        projectId: PROJECT,
        validationRequestId: REQUEST,
        requestProjectId: PROJECT,
      }),
    ).toBe(true);
  });

  it("after: owners still cannot review their own published project", () => {
    expect(
      memberCanInsertReview({
        reviewerId: OWNER,
        ownerId: OWNER,
        requestedBy: OWNER,
        projectStatus: "published",
        projectId: PROJECT,
        validationRequestId: REQUEST,
        requestProjectId: PROJECT,
      }),
    ).toBe(false);
  });
});

describe("attack scenarios: validation_score", () => {
  it("before/after: members cannot PATCH a fake score; service_role still syncs", () => {
    expect(memberCanUpdateValidationScore("authenticated")).toBe(false);
    expect(memberCanUpdateValidationScore("anon")).toBe(false);
    expect(memberCanUpdateValidationScore("service_role")).toBe(true);
    expect(
      applyValidationScoreLock({
        actorRole: "authenticated",
        op: "UPDATE",
        oldScore: 12,
        newScore: 100,
      }),
    ).toBe(12);
    expect(
      applyValidationScoreLock({
        actorRole: "service_role",
        op: "UPDATE",
        oldScore: 12,
        newScore: 40,
      }),
    ).toBe(40);
    expect(
      applyValidationScoreLock({
        actorRole: "authenticated",
        op: "INSERT",
        newScore: 99,
      }),
    ).toBe(0);
  });
});

describe("storage bucket policies (avatars)", () => {
  it("documents public read and forbids member writes", () => {
    expect(AVATAR_STORAGE_POLICY_SPEC).toHaveLength(1);
    expect(AVATAR_STORAGE_POLICY_SPEC[0]?.command).toBe("SELECT");
    expect(AVATAR_STORAGE_FORBIDDEN_MEMBER_COMMANDS).toEqual([
      "INSERT",
      "UPDATE",
      "DELETE",
    ]);
    expect(STORAGE_SQL).toContain("avatars_public_read");
    expect(STORAGE_SQL).toContain("bucket_id = 'avatars'");
    expect(STORAGE_SQL).toContain("No INSERT / UPDATE / DELETE");
  });

  it("before: a guessed member INSERT policy would let a stranger overwrite files", () => {
    expect(
      memberCanWriteAvatarObject({
        role: "authenticated",
        bucketId: AVATAR_STORAGE_BUCKET,
      }),
    ).toBe(false);
  });

  it("after: only service_role writes; anyone may read public URLs", () => {
    expect(
      memberCanWriteAvatarObject({
        role: "service_role",
        bucketId: AVATAR_STORAGE_BUCKET,
      }),
    ).toBe(true);
    expect(
      memberCanReadAvatarObject({
        role: "anon",
        bucketId: AVATAR_STORAGE_BUCKET,
      }),
    ).toBe(true);
  });
});

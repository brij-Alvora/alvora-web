import { describe, expect, it } from "vitest";

import { isAal2, isAdminMfaRequired } from "@/lib/admin/mfa";

describe("admin MFA enforcement flag", () => {
  it("is required in production unless explicitly disabled", () => {
    expect(isAdminMfaRequired("production", undefined)).toBe(true);
    expect(isAdminMfaRequired("production", "false")).toBe(false);
  });

  it("is off in development unless explicitly enabled", () => {
    expect(isAdminMfaRequired("development", undefined)).toBe(false);
    expect(isAdminMfaRequired("development", "true")).toBe(true);
  });

  it("treats only aal2 as verified", () => {
    expect(isAal2("aal1")).toBe(false);
    expect(isAal2("aal2")).toBe(true);
  });
});

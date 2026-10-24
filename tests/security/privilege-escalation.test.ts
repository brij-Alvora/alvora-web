import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { isAdminUser } from "@/lib/admin/access";
import {
  applyProfilePrivilegeLock,
  payloadEscalatesRole,
  PRIVILEGED_PROFILE_FIELDS,
  stripPrivilegedProfileFields,
} from "@/lib/security/profile-privileges";
import type { Profile } from "@/lib/supabase/types";

const SQL = readFileSync(
  path.resolve("supabase/migrations/20261016_security_hardening.sql"),
  "utf8",
);

function memberProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    user_id: "user-1",
    username: "builder",
    full_name: "Builder",
    headline: null,
    bio: null,
    location: null,
    city: null,
    country: null,
    website: null,
    github_url: null,
    linkedin_url: null,
    avatar_url: null,
    reputation_score: 10,
    role: "user",
    account_status: "active",
    is_founding_mentor: false,
    expertise: [],
    mentor_statement: null,
    why_i_mentor: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

describe("privilege escalation is impossible for members", () => {
  it("ships a database trigger that rewrites role and account_status", () => {
    expect(SQL).toContain("protect_profile_privileges");
    expect(SQL).toContain("NEW.role := OLD.role");
    expect(SQL).toContain("NEW.account_status := OLD.account_status");
    expect(SQL).toContain("NEW.role := 'user'");
    expect(SQL).toContain("NEW.account_status := 'active'");
    expect(SQL).toMatch(/GRANT UPDATE \(%s\) ON TABLE public\.profiles TO authenticated/);
  });

  it("allows service_role to change privileges and blocks authenticated JWTs", () => {
    expect(SQL).toContain("CREATE OR REPLACE FUNCTION public.is_service_role()");
    expect(SQL).toContain("jwt_role = 'service_role'");
    expect(SQL).toContain("IF public.is_service_role() THEN");
  });

  it("ignores a member PATCH that sets role=admin", () => {
    const locked = applyProfilePrivilegeLock({
      op: "UPDATE",
      actorRole: "authenticated",
      oldRow: { role: "user", account_status: "active", reputation_score: 10 },
      newRow: { role: "admin", account_status: "active", reputation_score: 9999 },
    });
    expect(locked.role).toBe("user");
    expect(locked.account_status).toBe("active");
    expect(locked.reputation_score).toBe(10);
    expect(payloadEscalatesRole({ role: "admin" })).toBe(true);
    expect(isAdminUser(memberProfile({ role: locked.role }), "user@example.com")).toBe(
      false,
    );
  });

  it("ignores a member PATCH that sets account_status=banned on someone else via own row rewrite", () => {
    const locked = applyProfilePrivilegeLock({
      op: "UPDATE",
      actorRole: "authenticated",
      oldRow: { role: "user", account_status: "suspended" },
      newRow: { role: "user", account_status: "active" },
    });
    expect(locked.account_status).toBe("suspended");
  });

  it("forces new member inserts to role=user and active status", () => {
    const locked = applyProfilePrivilegeLock({
      op: "INSERT",
      actorRole: "authenticated",
      newRow: { role: "admin", account_status: "banned" },
    });
    expect(locked).toEqual({
      role: "user",
      account_status: "active",
      reputation_score: null,
      is_founding_mentor: false,
    });
  });

  it("lets service_role promote and suspend", () => {
    const locked = applyProfilePrivilegeLock({
      op: "UPDATE",
      actorRole: "service_role",
      oldRow: { role: "user", account_status: "active" },
      newRow: { role: "admin", account_status: "suspended" },
    });
    expect(locked.role).toBe("admin");
    expect(locked.account_status).toBe("suspended");
  });

  it("strips privileged fields from profile save payloads", () => {
    const payload = stripPrivilegedProfileFields({
      username: "builder",
      role: "admin",
      account_status: "banned",
      reputation_score: 500,
    });
    for (const field of PRIVILEGED_PROFILE_FIELDS) {
      expect(payload).not.toHaveProperty(field);
    }
    expect(payload.username).toBe("builder");
  });

  it("does not grant admin from a user-role profile even if the client claims otherwise", () => {
    expect(isAdminUser(memberProfile({ role: "user" }), "nobody@example.com")).toBe(
      false,
    );
    expect(isAdminUser(memberProfile({ role: "admin" }), "nobody@example.com")).toBe(
      true,
    );
  });
});

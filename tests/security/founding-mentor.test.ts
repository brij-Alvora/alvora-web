import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseExpertiseInput } from "@/lib/mentors/expertise";
import { mapProfile } from "@/lib/profile/map-profile";
import { applyProfilePrivilegeLock } from "@/lib/security/profile-privileges";

const SQL = readFileSync(
  path.resolve("supabase/migrations/20261023_founding_mentors.sql"),
  "utf8",
);

describe("founding mentor flag", () => {
  it("adds a profile flag and expertise list without a new role", () => {
    expect(SQL).toContain("is_founding_mentor boolean");
    expect(SQL).toContain("expertise text[]");
    expect(SQL).not.toContain("CREATE TYPE");
    expect(SQL).toContain("NEW.is_founding_mentor := false");
    expect(SQL).toContain("NEW.is_founding_mentor := OLD.is_founding_mentor");
    expect(SQL).toContain("GRANT UPDATE (expertise)");
    expect(SQL).not.toContain("GRANT UPDATE (is_founding_mentor)");
  });

  it("keeps members from granting themselves the flag", () => {
    const locked = applyProfilePrivilegeLock({
      op: "UPDATE",
      actorRole: "authenticated",
      oldRow: {
        role: "user",
        account_status: "active",
        is_founding_mentor: false,
      },
      newRow: {
        role: "user",
        account_status: "active",
        is_founding_mentor: true,
      },
    });
    expect(locked.is_founding_mentor).toBe(false);
  });

  it("lets service_role mark a founding mentor", () => {
    const locked = applyProfilePrivilegeLock({
      op: "UPDATE",
      actorRole: "service_role",
      oldRow: {
        role: "user",
        account_status: "active",
        is_founding_mentor: false,
      },
      newRow: {
        role: "user",
        account_status: "active",
        is_founding_mentor: true,
      },
    });
    expect(locked.is_founding_mentor).toBe(true);
    expect(locked.role).toBe("user");
  });
});

describe("expertise", () => {
  it("parses a comma-separated list and drops duplicates", () => {
    expect(parseExpertiseInput("Product, UX, product")).toEqual({
      areas: ["Product", "UX"],
    });
  });

  it("rejects more than eight areas", () => {
    const value = "a1, a2, a3, a4, a5, a6, a7, a8, a9";
    expect(parseExpertiseInput(value)).toEqual({
      error: "List at most 8 expertise areas.",
    });
  });

  it("maps database rows onto the profile flag", () => {
    const profile = mapProfile({
      id: "p1",
      username: "ada",
      is_founding_mentor: true,
      expertise: ["AI agents", ""],
      role: "user",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });
    expect(profile?.is_founding_mentor).toBe(true);
    expect(profile?.expertise).toEqual(["AI agents"]);
    expect(profile?.mentor_statement).toBeNull();
    expect(profile?.why_i_mentor).toBeNull();
    expect(profile?.role).toBe("user");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  "supabase/migrations/20261016_projects_select_rls.sql",
  "utf8",
);

describe("projects SELECT RLS remediation", () => {
  it("force-enables RLS and drops every existing projects policy", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("FORCE ROW LEVEL SECURITY");
    expect(sql).toContain("DROP POLICY IF EXISTS");
    expect(sql).toContain("AND tablename = 'projects'");
  });

  it("allows public SELECT only for published rows or the owner", () => {
    expect(sql).toContain("status = 'published' OR auth.uid() = owner_id");
    expect(sql).not.toContain("USING (true)");
  });
});

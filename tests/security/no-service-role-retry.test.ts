import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "src/lib/actions/review.ts",
  "src/lib/actions/validation.ts",
  "src/lib/actions/support.ts",
  "src/lib/actions/report.ts",
  "src/lib/actions/project.ts",
];

describe("user actions do not retry with the service role", () => {
  it.each(files)("%s has no createAdminClient fallback insert/update", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).not.toMatch(/createAdminClient\(\)[\s\S]{0,200}\.insert/);
    expect(source).not.toMatch(/createAdminClient\(\)[\s\S]{0,200}\.update/);
  });
});

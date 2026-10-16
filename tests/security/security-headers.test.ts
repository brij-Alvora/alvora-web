import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = readFileSync("next.config.ts", "utf8");

describe("security headers", () => {
  it("sets CSP, frame, referrer, and permissions policies", () => {
    expect(config).toContain("Content-Security-Policy");
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("Referrer-Policy");
    expect(config).toContain("Permissions-Policy");
    expect(config).toContain("frame-ancestors 'none'");
    expect(config).toContain("DENY");
  });
});

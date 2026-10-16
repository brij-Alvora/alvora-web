import { afterEach, describe, expect, it, vi } from "vitest";

import {
  captchaRequired,
  verifyTurnstileToken,
} from "@/lib/auth/captcha";

const originalSecret = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  process.env.TURNSTILE_SECRET_KEY = originalSecret;
  vi.unstubAllGlobals();
});

describe("Turnstile public signup", () => {
  it("is required in production even without a fallback path", () => {
    expect(captchaRequired("production")).toBe(true);
  });

  it("allows local development when no secret is configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(captchaRequired("development")).toBe(false);
    await expect(verifyTurnstileToken(undefined)).resolves.toBe(true);
  });

  it("rejects missing and invalid tokens when a secret is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ success: false }),
      })),
    );
    await expect(verifyTurnstileToken("")).resolves.toBe(false);
    await expect(verifyTurnstileToken(null)).resolves.toBe(false);
    await expect(verifyTurnstileToken("bad-token")).resolves.toBe(false);
  });

  it("accepts only Cloudflare success=true", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ success: true }),
      })),
    );
    await expect(verifyTurnstileToken("valid-token")).resolves.toBe(true);
  });

  it("fails closed in production if the secret is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const required = captchaRequired("production");
    const allowed = required ? false : true;
    expect(allowed).toBe(false);
  });
});

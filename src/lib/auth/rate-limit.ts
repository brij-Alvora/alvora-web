import { createHash } from "crypto";

export type AuthRateAction =
  | "login"
  | "register"
  | "forgot_password"
  | "resend_confirmation";

export const AUTH_RATE_LIMITS: Record<
  AuthRateAction,
  { limit: number; windowMs: number }
> = {
  login: { limit: 8, windowMs: 15 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  forgot_password: { limit: 5, windowMs: 60 * 60 * 1000 },
  resend_confirmation: { limit: 5, windowMs: 60 * 60 * 1000 },
};

export const AUTH_RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait a few minutes and try again.";

export function hashRateBucket(value: string) {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export function isRateLimited(
  timestamps: number[],
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const cutoff = now - windowMs;
  return timestamps.filter((stamp) => stamp > cutoff).length >= limit;
}

const memoryBuckets = new Map<string, number[]>();

export function rememberAttempt(key: string, now = Date.now()) {
  const stamps = memoryBuckets.get(key) ?? [];
  stamps.push(now);
  memoryBuckets.set(key, stamps);
  return stamps;
}

export function memoryRateLimitHit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const stamps = (memoryBuckets.get(key) ?? []).filter(
    (stamp) => stamp > now - windowMs,
  );
  memoryBuckets.set(key, stamps);
  return isRateLimited(stamps, limit, windowMs, now);
}

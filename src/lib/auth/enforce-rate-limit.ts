"use server";

import { headers } from "next/headers";

import { clientIpFromHeaders } from "@/lib/auth/client-ip";
import {
  AUTH_RATE_LIMIT_MESSAGE,
  AUTH_RATE_LIMITS,
  type AuthRateAction,
  hashRateBucket,
  memoryRateLimitHit,
  rememberAttempt,
} from "@/lib/auth/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

async function countRecent(
  action: AuthRateAction,
  bucket: string,
  windowMs: number,
) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await admin
    .from("auth_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .eq("bucket", bucket)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

async function recordAttempt(action: AuthRateAction, bucket: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("auth_rate_limits").insert({
    action,
    bucket,
  });
  if (error) throw error;
}

export async function enforceAuthRateLimit(
  action: AuthRateAction,
  email?: string,
): Promise<string | null> {
  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);
  const { limit, windowMs } = AUTH_RATE_LIMITS[action];
  const buckets = [`ip:${hashRateBucket(ip)}`];
  if (email) buckets.push(`email:${hashRateBucket(email)}`);

  try {
    for (const bucket of buckets) {
      const recent = await countRecent(action, bucket, windowMs);
      if (recent >= limit) return AUTH_RATE_LIMIT_MESSAGE;
    }
    for (const bucket of buckets) {
      await recordAttempt(action, bucket);
    }
    return null;
  } catch {
    for (const bucket of buckets) {
      const key = `${action}:${bucket}`;
      if (memoryRateLimitHit(key, limit, windowMs)) {
        return AUTH_RATE_LIMIT_MESSAGE;
      }
      rememberAttempt(key);
    }
    return null;
  }
}

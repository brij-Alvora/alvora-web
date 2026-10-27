import { cookies } from "next/headers";

import {
  ACQUISITION_COOKIE_MAX_AGE,
  AID_COOKIE,
  MENTOR_INTENT_COOKIE,
  UTM_COOKIE,
  type AcquisitionEventName,
  type UtmParams,
} from "@/lib/analytics/events";
import { emptyUtm, hasUtm, parseStoredUtm } from "@/lib/analytics/utm";
import { getAdminClientOrNull } from "@/lib/supabase/admin";

function newSessionId() {
  return crypto.randomUUID();
}

function cookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACQUISITION_COOKIE_MAX_AGE,
  };
}

export async function readAcquisitionContext() {
  const store = await cookies();
  let sessionId = store.get(AID_COOKIE)?.value?.trim() || "";
  if (!sessionId) {
    sessionId = newSessionId();
    store.set(AID_COOKIE, sessionId, cookieOptions());
  }
  const utm = parseStoredUtm(store.get(UTM_COOKIE)?.value) ?? emptyUtm();
  const mentorIntent = store.get(MENTOR_INTENT_COOKIE)?.value === "1";
  return { sessionId, utm, mentorIntent };
}

export async function writeAcquisitionCookies(input: {
  sessionId?: string;
  utm?: UtmParams;
  mentorIntent?: boolean;
}) {
  const store = await cookies();
  const current = await readAcquisitionContext();
  const sessionId = input.sessionId || current.sessionId;
  store.set(AID_COOKIE, sessionId, cookieOptions());
  if (input.utm && hasUtm(input.utm)) {
    const first = hasUtm(current.utm) ? current.utm : input.utm;
    store.set(UTM_COOKIE, JSON.stringify(first), cookieOptions());
  }
  if (input.mentorIntent) {
    store.set(MENTOR_INTENT_COOKIE, "1", cookieOptions());
  }
  return readAcquisitionContext();
}

export async function persistAcquisitionEvent(input: {
  eventName: AcquisitionEventName;
  path?: string;
  referrer?: string;
  userId?: string | null;
  metadata?: Record<string, string | boolean | number | null>;
}) {
  try {
    const admin = getAdminClientOrNull();
    if (!admin) return;
    const context = await readAcquisitionContext();
    const { error } = await admin.from("acquisition_events").insert({
      session_id: context.sessionId,
      user_id: input.userId || null,
      event_name: input.eventName,
      path: input.path?.slice(0, 300) ?? null,
      referrer: input.referrer?.slice(0, 500) ?? null,
      utm_source: context.utm.utm_source,
      utm_medium: context.utm.utm_medium,
      utm_campaign: context.utm.utm_campaign,
      utm_term: context.utm.utm_term,
      utm_content: context.utm.utm_content,
      metadata: input.metadata ?? {},
    });
    if (error && error.code !== "23505") {
      console.error("[acquisition] insert failed", error.message);
    }
    if (input.userId) {
      await attachAcquisitionUser(context.sessionId, input.userId);
    }
  } catch (error) {
    console.error(
      "[acquisition] persist failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function attachAcquisitionUser(
  sessionId: string,
  userId: string,
) {
  try {
    const admin = getAdminClientOrNull();
    if (!admin || !sessionId || !userId) return;
    await admin
      .from("acquisition_events")
      .update({ user_id: userId })
      .eq("session_id", sessionId)
      .is("user_id", null);
  } catch (error) {
    console.error(
      "[acquisition] attach user failed",
      error instanceof Error ? error.message : error,
    );
  }
}


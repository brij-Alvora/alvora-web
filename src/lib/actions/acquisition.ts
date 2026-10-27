"use server";

import {
  isAcquisitionEventName,
  type AcquisitionEventName,
} from "@/lib/analytics/events";
import {
  persistAcquisitionEvent,
  readAcquisitionContext,
  writeAcquisitionCookies,
} from "@/lib/analytics/persist";
import { hasUtm, mergeFirstTouch, parseUtmSearch } from "@/lib/analytics/utm";
import { createClient } from "@/lib/supabase/server";

export async function captureAcquisitionContextAction(input: {
  search?: string;
  mentorIntent?: boolean;
  referrer?: string;
}) {
  const incoming = parseUtmSearch(input.search ?? "");
  const current = await readAcquisitionContext();
  await writeAcquisitionCookies({
    utm: mergeFirstTouch(current.utm, incoming),
    mentorIntent: input.mentorIntent || current.mentorIntent,
  });
  return { ok: true as const, referrer: input.referrer ?? null };
}

export async function trackAcquisitionEventAction(input: {
  eventName: string;
  path?: string;
  referrer?: string;
  search?: string;
  mentorIntent?: boolean;
}) {
  if (!isAcquisitionEventName(input.eventName)) {
    return { error: "Unknown event" };
  }
  await captureAcquisitionContextAction({
    search: input.search,
    mentorIntent:
      input.mentorIntent ||
      input.eventName === "founding_mentor_page_viewed" ||
      input.eventName === "invited_mentor_continue_clicked",
    referrer: input.referrer,
  });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await persistAcquisitionEvent({
    eventName: input.eventName as AcquisitionEventName,
    path: input.path,
    referrer: input.referrer,
    userId: user?.id ?? null,
  });
  return { ok: true as const };
}

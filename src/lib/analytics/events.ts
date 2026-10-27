export const ACQUISITION_EVENTS = [
  "founding_mentor_page_viewed",
  "invited_mentor_continue_clicked",
  "signup_started",
  "signup_completed",
  "profile_completed",
  "mentor_approved",
] as const;

export type AcquisitionEventName = (typeof ACQUISITION_EVENTS)[number];

export const ACQUISITION_EVENT_LABELS: Record<AcquisitionEventName, string> = {
  founding_mentor_page_viewed: "Founding Mentor page viewed",
  invited_mentor_continue_clicked: "Continue as an Invited Mentor",
  signup_started: "Signup started",
  signup_completed: "Signup completed",
  profile_completed: "Profile completed",
  mentor_approved: "Mentor approved",
};

export function isAcquisitionEventName(
  value: string,
): value is AcquisitionEventName {
  return (ACQUISITION_EVENTS as readonly string[]).includes(value);
}

export type UtmParams = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
};

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export function isMentorProfileComplete(profile: {
  expertise?: string[] | null;
  mentor_statement?: string | null;
}) {
  const statement = profile.mentor_statement?.trim() ?? "";
  return (profile.expertise?.length ?? 0) > 0 && statement.length >= 20;
}

export const AID_COOKIE = "alvora_aid";
export const UTM_COOKIE = "alvora_utm";
export const MENTOR_INTENT_COOKIE = "alvora_mentor";
export const ACQUISITION_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

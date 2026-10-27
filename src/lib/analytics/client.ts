import type { AcquisitionEventName, UtmParams } from "@/lib/analytics/events";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackBrowserEvent(
  eventName: AcquisitionEventName,
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  if (typeof window === "undefined") return;
  const payload = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ""),
  );
  window.gtag?.("event", eventName, payload);
  window.clarity?.("event", eventName);
}

export function identifyAnalyticsUser(userId: string | null) {
  if (typeof window === "undefined" || !userId) return;
  window.gtag?.("set", { user_id: userId });
  window.clarity?.("identify", userId);
}

export function setClarityUtm(utm: UtmParams) {
  if (typeof window === "undefined") return;
  if (utm.utm_source) window.clarity?.("set", "utm_source", utm.utm_source);
  if (utm.utm_medium) window.clarity?.("set", "utm_medium", utm.utm_medium);
  if (utm.utm_campaign) window.clarity?.("set", "utm_campaign", utm.utm_campaign);
}

export function gaMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
}

export function clarityProjectId() {
  return process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || "";
}

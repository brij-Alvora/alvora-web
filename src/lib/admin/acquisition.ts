import {
  ACQUISITION_EVENT_LABELS,
  ACQUISITION_EVENTS,
  type AcquisitionEventName,
} from "@/lib/analytics/events";
import { buildFunnelSteps, type FunnelStep } from "@/lib/analytics/funnel";
import { getAdminClientOrNull } from "@/lib/supabase/admin";

export type AcquisitionSourceRow = {
  label: string;
  value: number;
};

export type MentorAcquisitionReport = {
  funnel: FunnelStep[];
  sources: AcquisitionSourceRow[];
  campaigns: AcquisitionSourceRow[];
  invitedSessions: number;
};

const EMPTY: MentorAcquisitionReport = {
  funnel: buildFunnelSteps(
    ACQUISITION_EVENTS.map((key) => ({
      key,
      label: ACQUISITION_EVENT_LABELS[key],
      value: 0,
    })),
  ),
  sources: [],
  campaigns: [],
  invitedSessions: 0,
};

function tally(
  rows: Array<{ key: string | null; session_id: string }>,
): AcquisitionSourceRow[] {
  const counts = new Map<string, Set<string>>();
  for (const row of rows) {
    const label = row.key?.trim() || "(none)";
    const set = counts.get(label) ?? new Set<string>();
    set.add(row.session_id);
    counts.set(label, set);
  }
  return [...counts.entries()]
    .map(([label, sessions]) => ({ label, value: sessions.size }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export async function getMentorAcquisitionReport(): Promise<MentorAcquisitionReport> {
  const admin = getAdminClientOrNull();
  if (!admin) return EMPTY;

  const { data, error } = await admin
    .from("acquisition_events")
    .select("session_id, event_name, utm_source, utm_campaign");

  if (error || !Array.isArray(data)) {
    if (error && error.code !== "PGRST205") {
      console.error("[acquisition] funnel query failed", error.message);
    }
    return EMPTY;
  }

  const invited = new Set(
    data
      .filter((row) => row.event_name === "founding_mentor_page_viewed")
      .map((row) => row.session_id),
  );

  const counts = new Map<AcquisitionEventName, Set<string>>();
  for (const name of ACQUISITION_EVENTS) counts.set(name, new Set());

  for (const row of data) {
    if (!invited.has(row.session_id)) continue;
    const name = row.event_name as AcquisitionEventName;
    counts.get(name)?.add(row.session_id);
  }

  const invitedRows = data.filter((row) => invited.has(row.session_id));
  const firstTouch = new Map<
    string,
    { utm_source: string | null; utm_campaign: string | null }
  >();
  for (const row of invitedRows) {
    if (!firstTouch.has(row.session_id)) {
      firstTouch.set(row.session_id, {
        utm_source: row.utm_source,
        utm_campaign: row.utm_campaign,
      });
    }
  }

  return {
    funnel: buildFunnelSteps(
      ACQUISITION_EVENTS.map((key) => ({
        key,
        label: ACQUISITION_EVENT_LABELS[key],
        value: counts.get(key)?.size ?? 0,
      })),
    ),
    sources: tally(
      [...firstTouch.entries()].map(([session_id, utm]) => ({
        session_id,
        key: utm.utm_source,
      })),
    ),
    campaigns: tally(
      [...firstTouch.entries()].map(([session_id, utm]) => ({
        session_id,
        key: utm.utm_campaign,
      })),
    ),
    invitedSessions: invited.size,
  };
}

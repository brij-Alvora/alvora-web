import {
  UTM_KEYS,
  type UtmParams,
} from "@/lib/analytics/events";

const MAX_UTM_LENGTH = 180;

function cleanUtmValue(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().slice(0, MAX_UTM_LENGTH);
  if (!trimmed) return null;
  return trimmed.replace(/[\u0000-\u001f]/g, "");
}

export function emptyUtm(): UtmParams {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  };
}

export function parseUtmSearch(
  search: string | URLSearchParams | Record<string, string | string[] | undefined>,
): UtmParams {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search instanceof URLSearchParams
        ? search
        : new URLSearchParams(
            Object.entries(search).flatMap(([key, value]) => {
              if (typeof value === "string") return [[key, value]];
              if (Array.isArray(value) && value[0]) return [[key, value[0]]];
              return [];
            }),
          );

  const parsed = emptyUtm();
  for (const key of UTM_KEYS) {
    parsed[key] = cleanUtmValue(params.get(key));
  }
  return parsed;
}

export function hasUtm(utm: UtmParams) {
  return UTM_KEYS.some((key) => Boolean(utm[key]));
}

export function mergeFirstTouch(existing: UtmParams | null, incoming: UtmParams) {
  const base = existing ?? emptyUtm();
  if (hasUtm(base)) return base;
  return hasUtm(incoming) ? incoming : base;
}

export function parseStoredUtm(raw: string | null | undefined): UtmParams | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UtmParams>;
    const utm = emptyUtm();
    for (const key of UTM_KEYS) {
      utm[key] = cleanUtmValue(
        typeof parsed[key] === "string" ? parsed[key] : null,
      );
    }
    return hasUtm(utm) ? utm : emptyUtm();
  } catch {
    return null;
  }
}

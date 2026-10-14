export type GeoPlace = {
  city: string | null;
  region: string | null;
  country: string | null;
};

const UNSPECIFIED = "Unspecified";

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "united states": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "united kingdom": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  czechia: "Czech Republic",
  "czech republic": "Czech Republic",
  cr: "Czech Republic",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  deutschland: "Germany",
  germany: "Germany",
  india: "India",
  canada: "Canada",
  france: "France",
  spain: "Spain",
  italy: "Italy",
  netherlands: "Netherlands",
  holland: "Netherlands",
  poland: "Poland",
  australia: "Australia",
  brazil: "Brazil",
  mexico: "Mexico",
  japan: "Japan",
  china: "China",
  singapore: "Singapore",
  ireland: "Ireland",
  portugal: "Portugal",
  sweden: "Sweden",
  norway: "Norway",
  denmark: "Denmark",
  finland: "Finland",
  switzerland: "Switzerland",
  austria: "Austria",
  belgium: "Belgium",
  slovakia: "Slovakia",
  hungary: "Hungary",
  romania: "Romania",
  ukraine: "Ukraine",
  nigeria: "Nigeria",
  kenya: "Kenya",
  "south africa": "South Africa",
  israel: "Israel",
  "south korea": "South Korea",
  korea: "South Korea",
};

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeName(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return titleCase(trimmed);
}

function normalizeCountry(value: string | null | undefined) {
  const named = normalizeName(value);
  if (!named) return null;
  return COUNTRY_ALIASES[named.toLowerCase()] ?? named;
}

function parseLocation(location: string | null | undefined): GeoPlace {
  if (!location || !location.trim()) {
    return { city: null, region: null, country: null };
  }

  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return { city: null, region: null, country: null };

  if (parts.length === 1) {
    const single = parts[0];
    const asCountry = normalizeCountry(single);
    if (asCountry && COUNTRY_ALIASES[single.toLowerCase()]) {
      return { city: null, region: null, country: asCountry };
    }
    return { city: normalizeName(single), region: null, country: null };
  }

  if (parts.length === 2) {
    return {
      city: normalizeName(parts[0]),
      region: null,
      country: normalizeCountry(parts[1]),
    };
  }

  return {
    city: normalizeName(parts[0]),
    region: normalizeName(parts.slice(1, -1).join(" ")),
    country: normalizeCountry(parts[parts.length - 1]),
  };
}

/**
 * Prefer structured city/country columns when present.
 * Fall back to parsing the free-text location field.
 */
export function resolveProfileGeography(input: {
  location?: string | null;
  city?: string | null;
  country?: string | null;
  region?: string | null;
}): GeoPlace {
  const structuredCity = normalizeName(input.city);
  const structuredRegion = normalizeName(input.region);
  const structuredCountry = normalizeCountry(input.country);
  if (structuredCity || structuredRegion || structuredCountry) {
    return {
      city: structuredCity,
      region: structuredRegion,
      country: structuredCountry,
    };
  }
  return parseLocation(input.location);
}

export function countryLabel(place: GeoPlace) {
  return place.country ?? UNSPECIFIED;
}

export function cityLabel(place: GeoPlace) {
  if (!place.city) return UNSPECIFIED;
  return place.country ? `${place.city}, ${place.country}` : place.city;
}

export function regionLabel(place: GeoPlace) {
  if (place.region && place.country) {
    return `${place.region}, ${place.country}`;
  }
  if (place.region) return place.region;
  return place.country ?? UNSPECIFIED;
}

export { UNSPECIFIED };

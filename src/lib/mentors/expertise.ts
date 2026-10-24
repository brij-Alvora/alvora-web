export const MAX_EXPERTISE_AREAS = 8;

export function parseExpertiseInput(
  value: string | null | undefined,
): { areas: string[] } | { error: string } {
  const raw = value?.trim() ?? "";
  if (!raw) return { areas: [] };

  const parts = raw
    .split(/[,|\n]/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter((part) => part.length > 0);

  if (parts.length > MAX_EXPERTISE_AREAS) {
    return { error: "List at most 8 expertise areas." };
  }

  const areas: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (part.length < 2 || part.length > 40) {
      return { error: "Each expertise area must be 2–40 characters." };
    }
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    areas.push(part);
  }

  return { areas };
}

export function formatExpertise(areas: string[] | null | undefined) {
  return (areas ?? []).join(", ");
}

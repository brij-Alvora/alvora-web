export type SearchValues = Record<string, string | string[] | undefined>;

export function firstParam(values: SearchValues, key: string) {
  const value = values[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function matchesQuery(haystack: string, query: string) {
  if (!query) return true;
  return haystack.toLowerCase().includes(query.toLowerCase());
}

export function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function compareDate(a: string, b: string) {
  return a.localeCompare(b);
}

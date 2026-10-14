function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Operational timestamp: DD/MM/YYYY HH:mm:ss */
export function formatDiscoverDate(isoDate: string | null | undefined) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDiscoverDateTime(isoDate: string | null | undefined) {
  return formatDiscoverDate(isoDate);
}

export function startOfLocalDay(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDuration(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function formatAverageDuration(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const hours = ms / 36e5;
  if (hours >= 24) {
    const days = hours / 24;
    return `${Math.round(days * 10) / 10}d`;
  }
  if (hours >= 1) return `${Math.round(hours * 10) / 10}h`;
  const minutes = ms / 60000;
  if (minutes >= 1) return `${Math.round(minutes)}m`;
  return `${Math.max(1, Math.round(ms / 1000))}s`;
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function elapsedMs(from: string | null | undefined, to = new Date()) {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return null;
  return to.getTime() - start.getTime();
}

export function isOnLocalDay(iso: string | null | undefined, now = new Date()) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= startOfLocalDay(now).getTime();
}

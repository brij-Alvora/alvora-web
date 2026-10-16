export function clientIpFromHeaders(headerList: {
  get(name: string): string | null;
}) {
  const forwarded = headerList.get("cf-connecting-ip")
    ?? headerList.get("x-real-ip")
    ?? headerList.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const first = forwarded.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
}

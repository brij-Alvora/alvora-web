const FALLBACK = "Something went wrong. Please try again.";

export function toUserSafeError(
  error: unknown,
  fallback = FALLBACK,
): string {
  const message =
    typeof error === "string"
      ? error
      : error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";
  const text = message.trim();
  if (!text) return fallback;
  const lower = text.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials")
  ) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  if (lower.includes("user already registered")) {
    return "An account with that email already exists.";
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    lower.includes("permission denied") ||
    lower.includes("violates") ||
    lower.includes("jwt")
  ) {
    return fallback;
  }
  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "That record already exists.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Network issue. Check your connection and try again.";
  }
  if (text.length > 140) return fallback;
  return text;
}

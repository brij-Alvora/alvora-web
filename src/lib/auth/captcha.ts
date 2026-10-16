export const CAPTCHA_FAILED_MESSAGE =
  "Complete the CAPTCHA to create an account.";

export function captchaRequired(env = process.env.NODE_ENV) {
  return env === "production" || Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export function captchaSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip?: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return !captchaRequired();
  }
  if (!token || token.trim().length === 0) return false;

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
      },
    );
    const json = (await response.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

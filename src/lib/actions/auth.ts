"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  CAPTCHA_FAILED_MESSAGE,
  verifyTurnstileToken,
} from "@/lib/auth/captcha";
import { clientIpFromHeaders } from "@/lib/auth/client-ip";
import { safeNextPath } from "@/lib/auth/next-path";
import { toUserSafeError } from "@/lib/errors/user-safe";
import {
  attachAcquisitionUser,
  persistAcquisitionEvent,
  readAcquisitionContext,
} from "@/lib/analytics/persist";
import { getCurrentProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export type ActionResult = {
  error?: string;
  success?: string;
};

export async function loginAction(
  input: LoginInput,
  next?: string,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: toUserSafeError(error, "Email or password is incorrect.") };
  }

  const profile = await getCurrentProfile();
  if (profile?.account_status === "banned") {
    await supabase.auth.signOut();
    return { error: "This account is banned." };
  }

  const { data: sessionData } = await supabase.auth.getUser();
  if (sessionData.user) {
    const { sessionId } = await readAcquisitionContext();
    await attachAcquisitionUser(sessionId, sessionData.user.id);
  }

  redirect(safeNextPath(next));
}

export async function registerAction(
  input: RegisterInput,
  next?: string,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const headerList = await headers();
  const captchaOk = await verifyTurnstileToken(
    parsed.data.captchaToken,
    clientIpFromHeaders(headerList),
  );
  if (!captchaOk) return { error: CAPTCHA_FAILED_MESSAGE };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken" };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: absoluteUrl("/auth/callback"),
      data: {
        full_name: parsed.data.fullName,
        username: parsed.data.username,
      },
    },
  });

  if (error) {
    return { error: toUserSafeError(error, "Could not create your account.") };
  }

  if (data.user) {
    await persistAcquisitionEvent({
      eventName: "signup_completed",
      path: "/register",
      userId: data.user.id,
    });
  }

  if (data.user && !data.session) {
    return {
      success:
        "Check your email to confirm your account, then sign in.",
    };
  }

  redirect(safeNextPath(next || "/dashboard"));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: absoluteUrl("/auth/callback?next=/reset-password") },
  );

  if (error) {
    return { error: toUserSafeError(error, "Could not send a reset email.") };
  }

  return {
    success: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: toUserSafeError(error, "Could not update your password.") };
  }

  redirect("/dashboard");
}

export async function resendConfirmationAction(
  email: string,
): Promise<ActionResult> {
  const parsed = loginSchema.pick({ email: true }).safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: absoluteUrl("/auth/callback") },
  });
  if (error) {
    return {
      error: toUserSafeError(error, "Could not resend confirmation email."),
    };
  }
  return {
    success: "If that email needs confirmation, a new link is on its way.",
  };
}

"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

export type MfaActionResult = {
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  challengeId?: string;
  success?: string;
};

export async function enrollAdminTotpAction(): Promise<MfaActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Alvora Admin",
  });
  if (error || !data) {
    return {
      error:
        error?.message ??
        "Could not start TOTP enrollment. Enable MFA in Supabase Auth settings.",
    };
  }
  const totp = "totp" in data ? data.totp : null;
  return {
    factorId: data.id,
    qrCode: totp?.qr_code,
    secret: totp?.secret,
  };
}

export async function challengeAdminTotpAction(
  factorId: string,
): Promise<MfaActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error || !data) {
    return { error: error?.message ?? "Could not start MFA challenge" };
  }
  return { factorId, challengeId: data.id };
}

export async function verifyAdminTotpAction(input: {
  factorId: string;
  challengeId: string;
  code: string;
}): Promise<MfaActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.verify({
    factorId: input.factorId,
    challengeId: input.challengeId,
    code: input.code.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/mfa");
  return { success: "Authenticator verified. Admin MFA is active on this session." };
}

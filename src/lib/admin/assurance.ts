import { createClient } from "@/lib/supabase/server";

export async function getAdminAssuranceLevel() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return "aal1";
  return data?.currentLevel === "aal2" ? "aal2" : "aal1";
}

export async function listAdminMfaFactors() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return [];
  return data?.totp ?? [];
}

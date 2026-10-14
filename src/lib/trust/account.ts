import { getCurrentProfile } from "@/lib/profile/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProfile } from "@/lib/profile/map-profile";
import type { AccountStatus } from "@/lib/supabase/types";

export function isRestrictedAccount(status: AccountStatus) {
  return status === "suspended" || status === "banned";
}

export async function getAccountStatusForUser(
  userId: string,
): Promise<AccountStatus> {
  const current = await getCurrentProfile();
  if (
    current &&
    (current.id === userId || current.user_id === userId)
  ) {
    return current.account_status;
  }
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("*")
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();
    return (
      mapProfile((data ?? null) as Record<string, unknown> | null)
        ?.account_status ?? "active"
    );
  } catch {
    return "active";
  }
}

export async function assertCanContribute(
  userId: string,
): Promise<string | null> {
  const status = await getAccountStatusForUser(userId);
  if (status === "suspended") {
    return "This account is suspended and cannot create content. You can still contact Support.";
  }
  if (status === "banned") {
    return "This account is banned and cannot create content.";
  }
  return null;
}

export async function assertCanContactSupport(
  userId: string,
): Promise<string | null> {
  const status = await getAccountStatusForUser(userId);
  if (status === "banned") {
    return "This account is banned and cannot contact support.";
  }
  return null;
}

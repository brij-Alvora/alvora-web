import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(profile: Profile | null, email: string | null) {
  if (email && adminEmails().includes(email.toLowerCase())) return true;
  return profile?.role === "admin";
}

export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await getCurrentProfile();
  if (!isAdminUser(profile, user.email ?? null)) return null;
  return { user, profile };
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (!context) redirect("/dashboard");
  return context;
}

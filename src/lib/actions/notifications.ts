"use server";

import { revalidatePath } from "next/cache";

import { toUserSafeError } from "@/lib/errors/user-safe";
import { createClient } from "@/lib/supabase/server";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function markNotificationReadAction(id: string) {
  const userId = await requireUserId();
  if (!userId) return { error: "Sign in required" };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: toUserSafeError(error, "Could not update notification") };
  revalidatePath("/");
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId();
  if (!userId) return { error: "Sign in required" };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .eq("user_id", userId);
  if (error) return { error: toUserSafeError(error, "Could not update notifications") };
  revalidatePath("/");
  revalidatePath("/notifications");
  return { success: true };
}

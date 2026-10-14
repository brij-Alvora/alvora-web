import { backfillUserNotifications } from "@/lib/notifications/backfill";
import { mapNotification } from "@/lib/notifications/map-notification";
import { isNotificationUnread } from "@/lib/notifications/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/supabase/types";

function mapRows(data: unknown): AppNotification[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapNotification(row as Record<string, unknown>))
    .filter((row): row is AppNotification => row !== null);
}

export async function getMyNotifications(
  userId: string,
  limit = 100,
): Promise<AppNotification[]> {
  try {
    await backfillUserNotifications(userId);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) return mapRows(data);

    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return mapRows(adminData);
  } catch {
    return [];
  }
}

export function unreadCount(items: AppNotification[]) {
  return items.filter(isNotificationUnread).length;
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    await backfillUserNotifications(userId);
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error && typeof count === "number") return count;
    const { data } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", userId);
    return unreadCount(mapRows(data));
  } catch {
    return 0;
  }
}

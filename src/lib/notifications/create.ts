import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AppNotificationInsert,
  NotificationEntityType,
} from "@/lib/supabase/types";
import type { NotificationType } from "@/lib/notifications/types";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  href?: string;
  entityType: NotificationEntityType;
  entityId: string;
  createdAt?: string;
}): Promise<void> {
  if (!input.userId) return;
  try {
    const admin = createAdminClient();
    const base: AppNotificationInsert = {
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      body: input.message ?? null,
      href: input.href ?? null,
      entity_type: input.entityType,
      entity_id: input.entityId,
      source_id: input.entityId,
      is_read: false,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    };
    const payload: AppNotificationInsert = {
      ...base,
      channel: "in_app",
      email_status: "skipped",
    };
    const { error } = await admin.from("notifications").insert(payload);

    if (error) {
      if (error.code === "23505") return;
      const retry = await admin.from("notifications").insert(base);
      if (retry.error) {
        if (retry.error.code === "23505") return;
        console.error("[notifications] insert failed", retry.error.message);
      }
    }
  } catch (error) {
    console.error(
      "[notifications] insert failed",
      error instanceof Error ? error.message : error,
    );
  }
}

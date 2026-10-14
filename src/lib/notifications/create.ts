import { mapNotification } from "@/lib/notifications/map-notification";
import type { NotificationType } from "@/lib/notifications/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationEntityType } from "@/lib/supabase/types";

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
    const payload = {
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
    const { data, error } = await admin
      .from("notifications")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") return;
      console.error("[notifications] insert failed", error.message);
      return;
    }
    mapNotification((data ?? null) as Record<string, unknown> | null);
  } catch (error) {
    console.error(
      "[notifications] insert failed",
      error instanceof Error ? error.message : error,
    );
  }
}

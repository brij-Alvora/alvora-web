import { createAdminClient } from "@/lib/supabase/admin";

export async function logModerationAction(input: {
  adminId: string;
  entityType: string;
  entityId: string;
  action: string;
  reason?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("moderation_actions").insert({
      admin_id: input.adminId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      reason: input.reason?.trim() ? input.reason.trim() : null,
    });
    if (error) console.error("[moderation] log failed", error.message);
  } catch (error) {
    console.error(
      "[moderation] log failed",
      error instanceof Error ? error.message : error,
    );
  }
}

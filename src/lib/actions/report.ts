"use server";

import { revalidatePath } from "next/cache";

import { createAdminAlert } from "@/lib/admin/alerts";
import { toUserSafeError } from "@/lib/errors/user-safe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validations/report";

export type ReportActionResult = {
  error?: string;
  success?: string;
};

export async function submitReportAction(
  input: unknown,
): Promise<ReportActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid report" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to report content" };

  if (parsed.data.target_type === "user" && parsed.data.target_id === user.id) {
    return { error: "You cannot report your own account" };
  }

  const details = parsed.data.details?.trim() ? parsed.data.details.trim() : null;
  const payload = {
    reporter_id: user.id,
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    entity_type: parsed.data.target_type,
    entity_id: parsed.data.target_id,
    reason: parsed.data.reason,
    details,
    description: details,
    status: "open" as const,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(payload)
    .select("id")
    .maybeSingle();

  let reportId = typeof data?.id === "string" ? data.id : null;
  if (error || !reportId) {
    try {
      const admin = createAdminClient();
      const { data: adminData, error: adminError } = await admin
        .from("reports")
        .insert(payload)
        .select("id")
        .maybeSingle();
      reportId = typeof adminData?.id === "string" ? adminData.id : null;
      if (!reportId) {
        return {
          error: toUserSafeError(
            adminError?.message ?? error?.message,
            "Could not submit report",
          ),
        };
      }
    } catch (adminError) {
      return {
        error: toUserSafeError(
          adminError instanceof Error ? adminError.message : error?.message,
          "Could not submit report",
        ),
      };
    }
  }

  await createAdminAlert({
    type: "open_report",
    severity: "warning",
    title: "New report",
    message: parsed.data.reason.replaceAll("_", " "),
    entityType: parsed.data.target_type,
    entityId: parsed.data.target_id,
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { success: "Report submitted" };
}

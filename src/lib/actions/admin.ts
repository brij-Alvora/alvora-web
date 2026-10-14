"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { mapProfile } from "@/lib/profile/map-profile";
import { awardValidationCompleted } from "@/lib/reputation/award";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AccountStatus,
  ModerationStatus,
  ValidationStatus,
} from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";
import { VALIDATION_STATUSES } from "@/lib/validations/validation-request";

export type AdminActionResult = {
  error?: string;
  success?: string;
};

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/validations");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/analytics");
  revalidatePath("/discover");
  revalidatePath("/validations");
  revalidatePath("/dashboard");
}

async function authUserIdForProfile(profileId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .or(`id.eq.${profileId},user_id.eq.${profileId}`)
    .maybeSingle();
  const profile = mapProfile((data ?? null) as Record<string, unknown> | null);
  return profile ? { profile, authId: profile.user_id ?? profile.id } : null;
}

export async function setAccountStatusAction(
  profileId: string,
  status: AccountStatus,
): Promise<AdminActionResult> {
  const { user } = await requireAdmin();
  const mapped = await authUserIdForProfile(profileId);
  if (!mapped) return { error: "User not found" };
  if (mapped.authId === user.id) {
    return { error: "You cannot change your own account status" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      account_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapped.profile.id);

  if (error) return { error: error.message };

  try {
    await admin.auth.admin.updateUserById(mapped.authId, {
      ban_duration: status === "suspended" ? "876000h" : "none",
    });
  } catch (banError) {
    return {
      error:
        banError instanceof Error
          ? banError.message
          : "Profile updated but auth ban failed",
    };
  }

  revalidateAdmin();
  revalidatePath(`/admin/users/${mapped.profile.id}`);
  return {
    success:
      status === "suspended" ? "User suspended" : "User reactivated",
  };
}

export async function adminUpdateValidationStatusAction(
  requestId: string,
  status: ValidationStatus,
): Promise<AdminActionResult> {
  await requireAdmin();
  if (!VALIDATION_STATUSES.includes(status)) {
    return { error: "Invalid status" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("validation_requests")
    .update({ status })
    .eq("id", requestId)
    .select("*")
    .maybeSingle();

  const request = mapValidationRequest(
    (data ?? null) as Record<string, unknown> | null,
  );
  if (!request) return { error: error?.message ?? "Could not update status" };

  if (status === "completed") {
    await awardValidationCompleted(
      request.requested_by,
      request.id,
      request.project_id,
    );
  }

  revalidateAdmin();
  revalidatePath(`/validations/${request.id}`);
  return { success: "Status updated" };
}

export async function moderateReviewAction(
  reviewId: string,
  moderation: ModerationStatus | "deleted",
): Promise<AdminActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  if (moderation === "deleted") {
    const { error } = await admin.from("reviews").delete().eq("id", reviewId);
    if (error) return { error: error.message };
    revalidateAdmin();
    return { success: "Review deleted" };
  }

  const { error } = await admin
    .from("reviews")
    .update({ moderation_status: moderation })
    .eq("id", reviewId);

  if (error) return { error: error.message };
  revalidateAdmin();
  const labels: Record<ModerationStatus, string> = {
    visible: "Review restored",
    hidden: "Review hidden",
    flagged: "Review flagged",
  };
  return { success: labels[moderation] };
}

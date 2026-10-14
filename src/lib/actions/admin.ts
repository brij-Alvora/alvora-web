"use server";

import { revalidatePath } from "next/cache";

import { toUserSafeError } from "@/lib/errors/user-safe";
import { requireAdmin } from "@/lib/admin/access";
import {
  isActionableReportStatus,
  isActionableTicketStatus,
  resolveAdminAlerts,
} from "@/lib/admin/alerts";
import { logModerationAction } from "@/lib/admin/log";
import { createNotification } from "@/lib/notifications/create";
import { mapProfile } from "@/lib/profile/map-profile";
import { awardValidationCompleted } from "@/lib/reputation/award";
import { isReportQueueStatus } from "@/lib/reports/types";
import { isSupportStatus } from "@/lib/support/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AccountStatus,
  ModerationStatus,
  ReportStatus,
  SupportTicketStatus,
  ValidationStatus,
} from "@/lib/supabase/types";
import { mapSupportTicket } from "@/lib/support/map-ticket";
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
  revalidatePath("/admin/reports");
  revalidatePath("/admin/support");
  revalidatePath("/admin/alerts");
  revalidatePath("/support");
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
  reason?: string,
): Promise<AdminActionResult> {
  const { user } = await requireAdmin();
  const mapped = await authUserIdForProfile(profileId);
  if (!mapped) return { error: "User not found" };
  if (mapped.authId === user.id) {
    return { error: "You cannot change your own account status" };
  }
  if (
    status !== "active" &&
    status !== "warned" &&
    status !== "suspended" &&
    status !== "banned"
  ) {
    return { error: "Invalid status" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      account_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapped.profile.id);

  if (error) return { error: toUserSafeError(error, "Could not update account status") };

  const shouldBan = status === "banned";
  try {
    await admin.auth.admin.updateUserById(mapped.authId, {
      ban_duration: shouldBan ? "876000h" : "none",
    });
  } catch (banError) {
    return {
      error: toUserSafeError(
        banError,
        "Profile updated but sign-in lock failed",
      ),
    };
  }

  const action =
    status === "warned"
      ? "warn"
      : status === "suspended"
        ? "suspend"
        : status === "banned"
          ? "ban"
          : "reactivate";
  await logModerationAction({
    adminId: user.id,
    entityType: "user",
    entityId: mapped.profile.id,
    action,
    reason,
  });

  if (status === "warned") {
    await createNotification({
      userId: mapped.authId,
      type: "account_warned",
      title: "Account warning",
      message:
        reason?.trim() ||
        "A moderator issued a warning on your account. Please follow community guidelines.",
      href: "/support",
      entityType: "user",
      entityId: `warn:${Date.now()}`,
    });
  }

  revalidateAdmin();
  revalidatePath(`/admin/users/${mapped.profile.id}`);
  const labels: Record<AccountStatus, string> = {
    active: "User reactivated",
    warned: "User warned",
    suspended: "User suspended",
    banned: "User banned",
  };
  return { success: labels[status] };
}

export async function adminUpdateValidationStatusAction(
  requestId: string,
  status: ValidationStatus,
): Promise<AdminActionResult> {
  const { user } = await requireAdmin();
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
  if (!request) {
    return {
      error: toUserSafeError(error, "Could not update status"),
    };
  }

  if (status === "completed") {
    await awardValidationCompleted(
      request.requested_by,
      request.id,
      request.project_id,
    );
  }

  await logModerationAction({
    adminId: user.id,
    entityType: "validation_request",
    entityId: request.id,
    action: "validation_status",
    reason: status,
  });

  revalidateAdmin();
  revalidatePath(`/validations/${request.id}`);
  return { success: "Status updated" };
}

export async function moderateReviewAction(
  reviewId: string,
  moderation: ModerationStatus | "deleted",
): Promise<AdminActionResult> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  if (moderation === "deleted") {
    const { error } = await admin.from("reviews").delete().eq("id", reviewId);
    if (error) return { error: toUserSafeError(error, "Could not delete review") };
    await logModerationAction({
      adminId: user.id,
      entityType: "review",
      entityId: reviewId,
      action: "review_deleted",
    });
    revalidateAdmin();
    return { success: "Review deleted" };
  }

  const { error } = await admin
    .from("reviews")
    .update({ moderation_status: moderation })
    .eq("id", reviewId);

  if (error) return { error: toUserSafeError(error, "Could not update review") };
  await logModerationAction({
    adminId: user.id,
    entityType: "review",
    entityId: reviewId,
    action: `review_${moderation}`,
  });
  revalidateAdmin();
  const labels: Record<ModerationStatus, string> = {
    visible: "Review restored",
    hidden: "Review hidden",
    flagged: "Review flagged",
  };
  return { success: labels[moderation] };
}

export async function updateReportStatusAction(
  reportId: string,
  status: ReportStatus,
  adminNotes?: string,
): Promise<AdminActionResult> {
  const { user } = await requireAdmin();
  if (!isReportQueueStatus(status)) return { error: "Invalid status" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({
      status,
      admin_notes: adminNotes?.trim() ? adminNotes.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return { error: toUserSafeError(error, "Could not update report") };
  if (!isActionableReportStatus(status)) {
    await resolveAdminAlerts("report", reportId);
  }
  await logModerationAction({
    adminId: user.id,
    entityType: "report",
    entityId: reportId,
    action:
      status === "resolved"
        ? "report_resolved"
        : status === "dismissed"
          ? "report_dismissed"
          : "report_status",
    reason: adminNotes,
  });
  revalidateAdmin();
  return { success: "Report updated" };
}

export async function updateSupportTicketAction(
  ticketId: string,
  status: SupportTicketStatus,
  adminReply?: string,
): Promise<AdminActionResult> {
  const { user } = await requireAdmin();
  if (!isSupportStatus(status)) return { error: "Invalid status" };
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();
  const previous = mapSupportTicket(
    (existing ?? null) as Record<string, unknown> | null,
  );
  if (!previous) return { error: "Ticket not found" };

  const reply = adminReply?.trim() ? adminReply.trim() : previous.admin_reply;
  const replyChanged = Boolean(reply) && reply !== previous.admin_reply;
  const nextStatus =
    status === "open" && replyChanged ? "assigned" : status;
  const now = new Date().toISOString();
  const assignedAdminId =
    nextStatus === "assigned" || replyChanged
      ? (previous.assigned_admin_id ?? user.id)
      : nextStatus === "open"
        ? null
        : previous.assigned_admin_id;
  const firstResponseAt =
    previous.first_response_at ?? (replyChanged ? now : null);
  const closedAt =
    nextStatus === "resolved" || nextStatus === "closed"
      ? (previous.closed_at ?? now)
      : null;

  const { error } = await admin
    .from("support_tickets")
    .update({
      status: nextStatus,
      admin_reply: reply,
      assigned_admin_id: assignedAdminId,
      first_response_at: firstResponseAt,
      closed_at: closedAt,
      updated_at: now,
    })
    .eq("id", ticketId);
  if (error) return { error: toUserSafeError(error, "Could not update ticket") };

  if (replyChanged) {
    await createNotification({
      userId: previous.user_id,
      type: "support_ticket_updated",
      title: "Support ticket updated",
      message: "A teammate replied to your support ticket.",
      href: `/support/${ticketId}`,
      entityType: "support_ticket",
      entityId: ticketId,
    });
    await logModerationAction({
      adminId: user.id,
      entityType: "support_ticket",
      entityId: ticketId,
      action: "ticket_reply",
      reason: reply,
    });
  }

  if (
    (nextStatus === "resolved" || nextStatus === "closed") &&
    previous.status !== nextStatus
  ) {
    await createNotification({
      userId: previous.user_id,
      type: "support_ticket_resolved",
      title:
        nextStatus === "closed"
          ? "Support ticket closed"
          : "Support ticket resolved",
      message:
        nextStatus === "closed"
          ? "Your support ticket was closed."
          : "Your support ticket was marked resolved.",
      href: `/support/${ticketId}`,
      entityType: "support_ticket",
      entityId: ticketId,
    });
  }

  if (nextStatus !== previous.status) {
    await logModerationAction({
      adminId: user.id,
      entityType: "support_ticket",
      entityId: ticketId,
      action: "ticket_status",
      reason: nextStatus,
    });
  }

  if (!isActionableTicketStatus(nextStatus)) {
    await resolveAdminAlerts("support_ticket", ticketId);
  }

  revalidateAdmin();
  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/notifications");
  return { success: "Ticket updated" };
}

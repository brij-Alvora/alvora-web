import { createNotification } from "@/lib/notifications/create";
import type { NotificationType } from "@/lib/notifications/types";
import { mapProject } from "@/lib/project/map-project";
import { calculateReputation } from "@/lib/reputation/calculator";
import { mapSupportTicket } from "@/lib/support/map-ticket";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationEntityType } from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function backfillUserNotifications(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: existingRows } = await admin
      .from("notifications")
      .select("type, entity_id")
      .eq("user_id", userId);
    const seen = new Set(
      (existingRows ?? []).map(
        (row) => `${asString(row.type)}:${asString(row.entity_id)}`,
      ),
    );

    const notify = async (input: {
      type: NotificationType;
      title: string;
      message: string;
      href: string;
      entityType: NotificationEntityType;
      entityId: string;
      createdAt?: string;
    }) => {
      const key = `${input.type}:${input.entityId}`;
      if (!input.entityId || seen.has(key)) return;
      seen.add(key);
      await createNotification({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href,
        entityType: input.entityType,
        entityId: input.entityId,
        createdAt: input.createdAt,
      });
    };

    const [
      { data: requestRows },
      { data: projectRows },
      { data: ticketRows },
      reputation,
    ] = await Promise.all([
      admin.from("validation_requests").select("*").eq("requested_by", userId),
      admin.from("projects").select("*").eq("owner_id", userId),
      admin.from("support_tickets").select("*").eq("user_id", userId),
      calculateReputation(userId),
    ]);

    const requests = (requestRows ?? [])
      .map((row) => mapValidationRequest(row as Record<string, unknown>))
      .filter((row) => row !== null);
    const requestById = new Map(requests.map((request) => [request.id, request]));
    const projects = (projectRows ?? [])
      .map((row) => mapProject(row as Record<string, unknown>))
      .filter((row) => row !== null);

    const reviewRows: Record<string, unknown>[] = [];
    if (requests.length > 0) {
      const { data } = await admin
        .from("reviews")
        .select("*")
        .in(
          "validation_request_id",
          requests.map((request) => request.id),
        );
      if (Array.isArray(data)) {
        reviewRows.push(...(data as Record<string, unknown>[]));
      }
    }
    if (projects.length > 0) {
      const { data } = await admin
        .from("reviews")
        .select("*")
        .in(
          "project_id",
          projects.map((project) => project.id),
        );
      if (Array.isArray(data)) {
        reviewRows.push(...(data as Record<string, unknown>[]));
      }
    }

    const reviewsById = new Map<string, Record<string, unknown>>();
    for (const row of reviewRows) {
      const id = asString(row.id);
      if (id) reviewsById.set(id, row);
    }

    for (const review of reviewsById.values()) {
      const reviewId = asString(review.id);
      const reviewerId = asString(review.reviewer_id);
      if (!reviewId || reviewerId === userId) continue;
      const requestId = asString(review.validation_request_id);
      const request = requestId ? requestById.get(requestId) : undefined;
      await notify({
        type: "review_received",
        title: "Review received",
        message: "A builder submitted a review on your validation request.",
        href: request ? `/validations/${request.id}` : "/validations",
        entityType: "review",
        entityId: reviewId,
        createdAt: asString(review.created_at) || undefined,
      });
    }

    for (const request of requests) {
      if (request.status !== "completed") continue;
      await notify({
        type: "validation_completed",
        title: "Validation completed",
        message: "A validation request is now marked completed.",
        href: `/validations/${request.id}`,
        entityType: "validation_request",
        entityId: request.id,
        createdAt: request.created_at,
      });
    }

    for (const project of projects) {
      if (project.status !== "published") continue;
      await notify({
        type: "project_published",
        title: "Project published",
        message: "Your project is now live on Discover.",
        href: `/project/${project.slug}`,
        entityType: "project",
        entityId: project.id,
        createdAt: project.published_at ?? project.created_at,
      });
    }

    if (reputation.level !== "Builder") {
      const levelEvent = reputation.events.at(-1) ?? reputation.events[0];
      await notify({
        type: "reputation_level_up",
        title: `You reached ${reputation.level}`,
        message: `Your reputation is now ${reputation.total_points} points.`,
        href: "/reputation",
        entityType: "user",
        entityId: `level:${reputation.level}`,
        createdAt: levelEvent?.created_at,
      });
    }

    const tickets = (ticketRows ?? [])
      .map((row) => mapSupportTicket(row as Record<string, unknown>))
      .filter((row) => row !== null);
    for (const ticket of tickets) {
      if (ticket.admin_reply) {
        await notify({
          type: "support_ticket_updated",
          title: "Support ticket updated",
          message: "A teammate replied to your support ticket.",
          href: `/support/${ticket.id}`,
          entityType: "support_ticket",
          entityId: ticket.id,
          createdAt: ticket.updated_at || ticket.created_at,
        });
      }
      if (ticket.status === "resolved" || ticket.status === "closed") {
        await notify({
          type: "support_ticket_resolved",
          title:
            ticket.status === "closed"
              ? "Support ticket closed"
              : "Support ticket resolved",
          message:
            ticket.status === "closed"
              ? "Your support ticket was closed."
              : "Your support ticket was marked resolved.",
          href: `/support/${ticket.id}`,
          entityType: "support_ticket",
          entityId: ticket.id,
          createdAt: ticket.updated_at || ticket.created_at,
        });
      }
    }
  } catch (error) {
    console.error(
      "[notifications] backfill failed",
      error instanceof Error ? error.message : error,
    );
  }
}

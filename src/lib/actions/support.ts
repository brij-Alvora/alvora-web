"use server";

import { revalidatePath } from "next/cache";

import { createAdminAlert } from "@/lib/admin/alerts";
import { mapSupportTicket } from "@/lib/support/map-ticket";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/supabase/types";
import { toUserSafeError } from "@/lib/errors/user-safe";
import { assertCanContactSupport } from "@/lib/trust/account";
import {
  supportReplySchema,
  supportTicketSchema,
} from "@/lib/validations/support";

export type SupportActionResult = {
  error?: string;
  success?: string;
  ticket?: SupportTicket;
};

export async function createSupportTicketAction(
  input: unknown,
): Promise<SupportActionResult> {
  const parsed = supportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid ticket" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to contact support" };
  const blocked = await assertCanContactSupport(user.id);
  if (blocked) return { error: blocked };

  const payload = {
    user_id: user.id,
    category: parsed.data.category,
    priority: parsed.data.priority,
    subject: parsed.data.subject,
    message: parsed.data.message,
    description: parsed.data.message,
    status: "open" as const,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("support_tickets")
    .insert(payload)
    .select("*")
    .maybeSingle();

  const saved = (data ?? null) as Record<string, unknown> | null;
  if (!saved) {
    return {
      error: toUserSafeError(error?.message, "Could not create ticket"),
    };
  }

  const ticket = mapSupportTicket(saved);
  if (!ticket) return { error: "Could not create ticket" };

  await createAdminAlert({
    type:
      ticket.priority === "critical" ? "critical_ticket" : "open_ticket",
    severity:
      ticket.priority === "critical"
        ? "critical"
        : ticket.priority === "high"
          ? "warning"
          : "info",
    title: "New support ticket",
    message: ticket.subject,
    entityType: "support_ticket",
    entityId: ticket.id,
  });

  revalidatePath("/support");
  revalidatePath("/admin/support");
  revalidatePath("/admin");
  revalidatePath("/admin/alerts");
  revalidatePath("/notifications");
  return { success: "Ticket submitted", ticket };
}

function appendFollowUp(existing: string | null, message: string) {
  const stamp = new Date().toISOString();
  const block = `[${stamp}]\n${message}`;
  return existing ? `${existing}\n\n${block}` : block;
}

export async function replyToSupportTicketAction(
  ticketId: string,
  message: string,
): Promise<SupportActionResult> {
  const parsed = supportReplySchema.safeParse({ message });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reply" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };
  const blocked = await assertCanContactSupport(user.id);
  if (blocked) return { error: blocked };

  const { data: existing } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .maybeSingle();
  const ticket = mapSupportTicket(
    (existing ?? null) as Record<string, unknown> | null,
  );
  if (!ticket) return { error: "Ticket not found" };

  const now = new Date().toISOString();
  const reopen = ticket.status === "resolved" || ticket.status === "closed";
  const { data, error } = await supabase
    .from("support_tickets")
    .update({
      user_follow_up: appendFollowUp(ticket.user_follow_up, parsed.data.message),
      user_follow_up_at: now,
      updated_at: now,
      ...(reopen ? { status: "open" as const, closed_at: null } : {}),
    })
    .eq("id", ticket.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  const saved = mapSupportTicket((data ?? null) as Record<string, unknown> | null);
  if (!saved) {
    return { error: toUserSafeError(error?.message, "Could not send reply") };
  }

  await createAdminAlert({
    type: "open_ticket",
    severity: "info",
    title: reopen ? "Support ticket reopened" : "Support ticket reply",
    message: saved.subject,
    entityType: "support_ticket",
    entityId: saved.id,
  });

  revalidatePath("/support");
  revalidatePath(`/support/${saved.id}`);
  revalidatePath("/admin/support");
  revalidatePath("/admin/alerts");
  return { success: "Reply sent", ticket: saved };
}

export async function replyToAccountWarningAction(
  warningMessage: string,
  message: string,
): Promise<SupportActionResult> {
  const parsed = supportReplySchema.safeParse({ message });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reply" };
  }

  const warning = warningMessage.trim() || "Account warning";
  return createSupportTicketAction({
    category: "account",
    priority: "high",
    subject: "Response to account warning",
    message: `Warning received:\n${warning}\n\nMy reply:\n${parsed.data.message}`,
  });
}

"use server";

import { revalidatePath } from "next/cache";

import { createAdminAlert } from "@/lib/admin/alerts";
import { mapSupportTicket } from "@/lib/support/map-ticket";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/supabase/types";
import { toUserSafeError } from "@/lib/errors/user-safe";
import { assertCanContactSupport } from "@/lib/trust/account";
import { supportTicketSchema } from "@/lib/validations/support";

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

  let saved = (data ?? null) as Record<string, unknown> | null;
  if (!saved) {
    try {
      const admin = createAdminClient();
      const { data: adminData, error: adminError } = await admin
        .from("support_tickets")
        .insert(payload)
        .select("*")
        .maybeSingle();
      saved = (adminData ?? null) as Record<string, unknown> | null;
      if (!saved) {
        return {
          error: toUserSafeError(
            adminError?.message ?? error?.message,
            "Could not create ticket",
          ),
        };
      }
    } catch (adminError) {
      return {
        error: toUserSafeError(
          adminError instanceof Error ? adminError.message : error?.message,
          "Could not create ticket",
        ),
      };
    }
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

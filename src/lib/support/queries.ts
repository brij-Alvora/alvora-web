import { mapSupportTicket } from "@/lib/support/map-ticket";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket } from "@/lib/supabase/types";

function mapRows(data: unknown): SupportTicket[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapSupportTicket(row as Record<string, unknown>))
    .filter((row): row is SupportTicket => row !== null);
}

export async function getMySupportTickets(
  userId: string,
): Promise<SupportTicket[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) return mapRows(data);

    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return mapRows(adminData);
  } catch {
    return [];
  }
}

export async function getMySupportTicketById(
  userId: string,
  id: string,
): Promise<SupportTicket | null> {
  const tickets = await getMySupportTickets(userId);
  return tickets.find((ticket) => ticket.id === id) ?? null;
}

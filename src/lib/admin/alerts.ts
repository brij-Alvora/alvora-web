import { getAdminReports, getAdminSupportTickets } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminAlert, AdminAlertSeverity } from "@/lib/supabase/types";

export type AdminInboxItem = {
  id: string;
  source: "ticket" | "report" | "alert";
  severity: AdminAlertSeverity;
  title: string;
  message: string | null;
  href: string;
  created_at: string;
};

function asAlert(row: Record<string, unknown>): AdminAlert | null {
  const id = typeof row.id === "string" ? row.id : "";
  const type = typeof row.type === "string" ? row.type : "";
  if (!id || !type) return null;
  const severity =
    row.severity === "critical" || row.severity === "info"
      ? row.severity
      : "warning";
  return {
    id,
    type,
    severity,
    title: typeof row.title === "string" ? row.title : "Alert",
    message: typeof row.message === "string" ? row.message : null,
    entity_type: typeof row.entity_type === "string" ? row.entity_type : null,
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    is_read: row.is_read === true,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

export async function createAdminAlert(input: {
  type: string;
  severity: AdminAlertSeverity;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("admin_alerts").insert({
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
    if (error) console.error("[admin-alerts] insert failed", error.message);
  } catch (error) {
    console.error(
      "[admin-alerts] insert failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function getAdminAlerts(): Promise<AdminAlert[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !data) return [];
    return data
      .map((row) => asAlert(row as Record<string, unknown>))
      .filter((row): row is AdminAlert => row !== null);
  } catch {
    return [];
  }
}

export function isActionableTicketStatus(status: string) {
  return status === "open" || status === "assigned";
}

export function isActionableReportStatus(status: string) {
  return status === "open" || status === "under_review";
}

export async function resolveAdminAlerts(
  entityType: string,
  entityId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("admin_alerts")
      .update({ is_read: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_read", false);
    if (error) console.error("[admin-alerts] resolve failed", error.message);
  } catch (error) {
    console.error(
      "[admin-alerts] resolve failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function getAdminInbox(): Promise<{
  items: AdminInboxItem[];
  count: number;
}> {
  const [tickets, reports] = await Promise.all([
    getAdminSupportTickets(),
    getAdminReports(),
  ]);

  const items: AdminInboxItem[] = [];

  for (const ticket of tickets) {
    if (!isActionableTicketStatus(ticket.status)) continue;
    items.push({
      id: `ticket:${ticket.id}`,
      source: "ticket",
      severity:
        ticket.priority === "critical"
          ? "critical"
          : ticket.priority === "high"
            ? "warning"
            : "info",
      title: ticket.subject,
      message: `${ticket.priority} · ${ticket.status} · ${ticket.category.replaceAll("_", " ")}`,
      href: `/admin/support?ticket=${ticket.id}`,
      created_at: ticket.created_at,
    });
  }

  for (const report of reports) {
    if (!isActionableReportStatus(report.status)) continue;
    items.push({
      id: `report:${report.id}`,
      source: "report",
      severity: "warning",
      title: `Report · ${report.reason.replaceAll("_", " ")}`,
      message: report.description,
      href: `/admin/reports?report=${report.id}`,
      created_at: report.created_at,
    });
  }

  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { items, count: items.length };
}

export async function getAdminModerationActions(
  entityType?: string,
  entityId?: string,
) {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("moderation_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    if (entityType) query = query.eq("entity_type", entityType);
    if (entityId) query = query.eq("entity_id", entityId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

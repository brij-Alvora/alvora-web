import Link from "next/link";

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { QueueStatusForm } from "@/components/admin/queue-status-form";
import {
  reportTimeline,
  StatusTimeline,
} from "@/components/ops/status-timeline";
import {
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminReports } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { elapsedMs, formatDuration } from "@/lib/ops/time";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUSES,
  REPORT_TARGET_LABELS,
  REPORT_TARGET_TYPES,
  type ReportReason,
} from "@/lib/reports/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin reports · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

function reasonLabel(reason: string) {
  return REPORT_REASON_LABELS[reason as ReportReason] ?? reason;
}

function targetHref(type: string, id: string) {
  if (type === "user") return `/admin/users/${id}`;
  if (type === "project") return `/admin/projects/${id}`;
  if (type === "validation_request") return `/admin/validations/${id}`;
  if (type === "review") return `/admin/reviews/${id}`;
  return "/admin";
}

function chipHref(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  if (next.get(key) === value) next.delete(key);
  else next.set(key, value);
  const query = next.toString();
  return query ? `/admin/reports?${query}` : "/admin/reports";
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const status = firstParam(params, "status");
  const entityType = firstParam(params, "entity_type");
  const reason = firstParam(params, "reason");
  const selected = firstParam(params, "report");
  const sort = firstParam(params, "sort") || "newest";
  const reports = await getAdminReports();
  const current = new URLSearchParams();
  if (q) current.set("q", q);
  if (status) current.set("status", status);
  if (entityType) current.set("entity_type", entityType);
  if (reason) current.set("reason", reason);
  if (sort && sort !== "newest") current.set("sort", sort);

  const filtered = reports
    .filter((report) => {
      const haystack = [
        report.reason,
        report.description,
        report.entity_type,
        report.entity_id,
        report.status,
      ]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (status && report.status !== status) return false;
      if (entityType && report.entity_type !== entityType) return false;
      if (reason && report.reason !== reason) return false;
      return true;
    })
    .sort((a, b) =>
      sort === "oldest"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
    );

  const now = new Date();
  const chips: Array<{ key: string; value: string; label: string }> = [
    ...REPORT_STATUSES.map((value) => ({
      key: "status",
      value,
      label: REPORT_STATUS_LABELS[value],
    })),
    { key: "reason", value: "spam", label: "Spam" },
    { key: "reason", value: "harassment", label: "Harassment" },
    { key: "reason", value: "fake_project", label: "Fake Project" },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {reports.length}{" "}
          {reports.length === 1 ? "report" : "reports"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = current.get(chip.key) === chip.value;
          return (
            <Link
              key={`${chip.key}:${chip.value}`}
              href={chipHref(current, chip.key, chip.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
      <AdminToolbar
        placeholder="Search reason, target, notes"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
        ]}
        filters={[
          {
            name: "status",
            label: "All statuses",
            options: REPORT_STATUSES.map((value) => ({
              value,
              label: REPORT_STATUS_LABELS[value],
            })),
          },
          {
            name: "entity_type",
            label: "All targets",
            options: REPORT_TARGET_TYPES.map((value) => ({
              value,
              label: REPORT_TARGET_LABELS[value],
            })),
          },
        ]}
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No reports match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((report) => {
            const openMs =
              report.status === "open" || report.status === "under_review"
                ? elapsedMs(report.created_at, now)
                : elapsedMs(
                    report.created_at,
                    new Date(report.updated_at || report.created_at),
                  );
            return (
              <li key={report.id} id={`report-${report.id}`}>
                <Card
                  className={cn(
                    "shadow-sm",
                    selected === report.id ? "border-primary/40" : "",
                  )}
                >
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <p className="font-medium">
                        {REPORT_TARGET_LABELS[report.entity_type]} ·{" "}
                        {reasonLabel(report.reason)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {REPORT_STATUS_LABELS[report.status]} · Created{" "}
                        {formatDiscoverDate(report.created_at)}
                      </p>
                      {report.description ? (
                        <p className="mt-2 text-sm">{report.description}</p>
                      ) : null}
                    </div>
                    <StatusTimeline steps={reportTimeline(report.status)} />
                    <p className="text-xs text-muted-foreground">
                      Time Open {formatDuration(openMs)} · Time Since Last
                      Action {formatDuration(elapsedMs(report.updated_at, now))}
                    </p>
                    <Link
                      href={targetHref(report.entity_type, report.entity_id)}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Open target
                    </Link>
                    <QueueStatusForm
                      kind="report"
                      id={report.id}
                      current={report.status}
                      notes={report.admin_notes}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

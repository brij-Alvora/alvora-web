import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { ValidationStatusForm } from "@/components/admin/validation-status-form";
import {
  compareDate,
  compareText,
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminValidations } from "@/lib/admin/queries";
import type { ValidationStatus } from "@/lib/supabase/types";
import {
  VALIDATION_STATUS_LABELS,
  VALIDATION_TYPE_LABELS,
} from "@/lib/validations/validation-request";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin validations · Alvora",
};

const GROUPS: ValidationStatus[] = ["open", "in_review", "completed"];

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function AdminValidationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const sort = firstParam(params, "sort") || "newest";
  const statusFilter = firstParam(params, "status") as ValidationStatus | "";
  const type = firstParam(params, "type");
  const requests = await getAdminValidations();

  const filtered = requests
    .filter((request) => {
      const haystack = [
        request.request_title,
        request.projectTitle,
        request.status,
        VALIDATION_TYPE_LABELS[request.validation_type],
      ]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (statusFilter && request.status !== statusFilter) return false;
      if (type && request.validation_type !== type) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return compareDate(a.created_at, b.created_at);
      if (sort === "title") return compareText(a.request_title, b.request_title);
      return compareDate(b.created_at, a.created_at);
    });

  const groups = statusFilter
    ? GROUPS.filter((status) => status === statusFilter)
    : GROUPS;

  return (
    <div className="space-y-8">
      <AdminToolbar
        placeholder="Search title, project, type"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "title", label: "Title" },
        ]}
      />
      {groups.map((status) => {
        const items = filtered.filter((request) => request.status === status);
        return (
          <section key={status} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {VALIDATION_STATUS_LABELS[status]}
              </h2>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "request" : "requests"}
              </p>
            </div>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                None.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((request) => (
                  <li key={request.id}>
                    <Card className="shadow-sm">
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div>
                          <p className="font-medium">{request.request_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.projectTitle ?? "Project"} ·{" "}
                            {VALIDATION_TYPE_LABELS[request.validation_type]}
                          </p>
                        </div>
                        <ValidationStatusForm
                          requestId={request.id}
                          current={request.status}
                        />
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

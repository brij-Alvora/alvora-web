import { ValidationStatusForm } from "@/components/admin/validation-status-form";
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

export default async function AdminValidationsPage() {
  const requests = await getAdminValidations();

  return (
    <div className="space-y-8">
      {GROUPS.map((status) => {
        const items = requests.filter((request) => request.status === status);
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

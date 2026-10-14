import { Card, CardContent } from "@/components/ui/card";
import type { AdminCounts } from "@/lib/admin/queries";

const LABELS: { key: keyof AdminCounts; label: string }[] = [
  { key: "users", label: "Total users" },
  { key: "projects", label: "Projects" },
  { key: "validationRequests", label: "Validation requests" },
  { key: "reviews", label: "Reviews" },
  { key: "reputationEvents", label: "Reputation events" },
];

export function AdminStatGrid({ counts }: { counts: AdminCounts }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {LABELS.map((item) => (
        <Card key={item.key} className="shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
              {counts[item.key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

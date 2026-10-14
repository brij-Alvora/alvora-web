import { AdminStatGrid } from "@/components/admin/admin-stat-grid";
import { getAdminAnalytics } from "@/lib/admin/queries";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin analytics · Alvora",
};

function Breakdown({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data);
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-5">
        <h3 className="font-medium">{title}</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {entries.map(([key, value]) => (
              <li key={key} className="flex items-center justify-between gap-3">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="font-medium tabular-nums">{value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Live totals and composition from production tables.
        </p>
      </div>
      <AdminStatGrid counts={analytics} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Breakdown title="Users by status" data={analytics.usersByStatus} />
        <Breakdown title="Projects by status" data={analytics.projectsByStatus} />
        <Breakdown
          title="Validations by status"
          data={analytics.validationsByStatus}
        />
        <Breakdown title="Reviews by rating" data={analytics.reviewsByRating} />
      </div>
    </div>
  );
}

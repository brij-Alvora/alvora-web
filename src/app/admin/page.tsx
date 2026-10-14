import Link from "next/link";

import { AdminStatGrid } from "@/components/admin/admin-stat-grid";
import { getAdminCounts } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin · Alvora",
};

export default async function AdminDashboardPage() {
  const counts = await getAdminCounts();

  return (
    <div className="space-y-6">
      <AdminStatGrid counts={counts} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="font-medium">Users</p>
            <p className="text-sm text-muted-foreground">
              View, suspend, and reactivate accounts.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/users">Open users</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="font-medium">Projects</p>
            <p className="text-sm text-muted-foreground">
              Filter published work by category and status.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/projects">Open projects</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="font-medium">Validations</p>
            <p className="text-sm text-muted-foreground">
              Oversee open, in-review, and completed requests.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/validations">Open validations</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="font-medium">Reviews</p>
            <p className="text-sm text-muted-foreground">
              Flag, hide, or delete submitted reviews.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/reviews">Open moderation</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="font-medium">Analytics</p>
            <p className="text-sm text-muted-foreground">
              Breakdowns of live platform volume.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/analytics">Open analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

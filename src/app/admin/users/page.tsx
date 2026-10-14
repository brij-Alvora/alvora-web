import { UserActions } from "@/components/admin/user-actions";
import { getAdminUsers } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin users · Alvora",
};

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">User management</h2>
        <p className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "account" : "accounts"}
        </p>
      </div>
      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No profiles found.
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((row) => (
            <Card key={row.profile.id} className="shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {hasProfileValue(row.profile.full_name)
                      ? row.profile.full_name
                      : row.profile.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{row.profile.username} · {row.level} · {row.points} pts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDiscoverDate(row.profile.created_at)}
                    {row.profile.account_status === "suspended" ? " · Suspended" : ""}
                    {row.profile.role === "admin" ? " · Admin" : ""}
                  </p>
                </div>
                <UserActions
                  profileId={row.profile.id}
                  username={row.profile.username}
                  status={row.profile.account_status}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

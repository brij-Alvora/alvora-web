import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { UserActions } from "@/components/admin/user-actions";
import {
  compareDate,
  compareText,
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminUsers } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import {
  cityLabel,
  countryLabel,
  regionLabel,
  resolveProfileGeography,
} from "@/lib/geo/resolve";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin users · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const sort = firstParam(params, "sort") || "newest";
  const status = firstParam(params, "status");
  const level = firstParam(params, "level");
  const country = firstParam(params, "country");
  const city = firstParam(params, "city");
  const region = firstParam(params, "region");
  const users = await getAdminUsers();

  const filtered = users
    .filter((row) => {
      const place = resolveProfileGeography(row.profile);
      const haystack = [
        row.profile.username,
        row.profile.full_name,
        row.profile.headline,
        row.level,
        row.profile.account_status,
        countryLabel(place),
        cityLabel(place),
      ]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (status && row.profile.account_status !== status) return false;
      if (level && row.level !== level) return false;
      if (country && countryLabel(place) !== country) return false;
      if (city && cityLabel(place) !== city) return false;
      if (region && regionLabel(place) !== region) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return compareDate(a.profile.created_at, b.profile.created_at);
      }
      if (sort === "name") {
        return compareText(
          a.profile.full_name || a.profile.username,
          b.profile.full_name || b.profile.username,
        );
      }
      if (sort === "reputation") return b.points - a.points;
      return compareDate(b.profile.created_at, a.profile.created_at);
    });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">User management</h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {users.length}{" "}
          {users.length === 1 ? "account" : "accounts"}
        </p>
      </div>
      <AdminToolbar
        placeholder="Search name, username, location"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "name", label: "Name" },
          { value: "reputation", label: "Reputation" },
        ]}
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No profiles match these filters.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
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
                    {row.profile.account_status === "suspended"
                      ? " · Suspended"
                      : ""}
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

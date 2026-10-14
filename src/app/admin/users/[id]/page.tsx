import Link from "next/link";
import { notFound } from "next/navigation";

import { UserActions } from "@/components/admin/user-actions";
import { getAdminUserById } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Admin user · Alvora",
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const row = await getAdminUserById(id);
  if (!row) notFound();

  const name = hasProfileValue(row.profile.full_name)
    ? row.profile.full_name
    : row.profile.username;

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {row.profile.role === "admin" ? "Admin" : "User"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h2>
            <p className="text-sm text-muted-foreground">@{row.profile.username}</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Reputation
              </dt>
              <dd className="text-sm font-medium">
                {row.points} pts · {row.level}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Join date
              </dt>
              <dd className="text-sm font-medium">
                {formatDiscoverDate(row.profile.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </dt>
              <dd className="text-sm font-medium capitalize">
                {row.profile.account_status}
              </dd>
            </div>
            {row.profile.headline ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Headline
                </dt>
                <dd className="text-sm font-medium">{row.profile.headline}</dd>
              </div>
            ) : null}
          </dl>
          <UserActions
            profileId={row.profile.id}
            username={row.profile.username}
            status={row.profile.account_status}
          />
          <Link
            href="/admin/users"
            className="inline-block text-sm text-muted-foreground hover:underline"
          >
            Back to users
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

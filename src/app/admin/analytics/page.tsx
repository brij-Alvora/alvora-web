import Link from "next/link";

import { AdminStatGrid } from "@/components/admin/admin-stat-grid";
import { Funnel } from "@/components/admin/funnel";
import { GrowthTable } from "@/components/admin/growth-table";
import { RankingList } from "@/components/admin/ranking-list";
import { getAdminAnalytics } from "@/lib/admin/queries";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin analytics · Alvora",
};

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Live totals, geography, and composition from production tables.
        </p>
      </div>

      <AdminStatGrid counts={analytics} />

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Builder levels
        </h3>
        <RankingList
          title="Level distribution"
          items={analytics.levels}
          emptyLabel="No builders yet."
          hrefFor={(item) =>
            `/admin/users?level=${encodeURIComponent(item.label)}`
          }
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Growth</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          <GrowthTable
            title="Weekly growth"
            caption="Last 7 days vs the prior 7 days."
            metrics={analytics.weeklyGrowth}
          />
          <GrowthTable
            title="Monthly growth"
            caption="Last 30 days vs the prior 30 days."
            metrics={analytics.monthlyGrowth}
          />
        </div>
      </section>

      <Funnel steps={analytics.funnel} />

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Platform health
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Profile Completion %"
            value={analytics.platformHealth.profileCompletionPercent}
          />
          <SummaryCard
            label="Projects with Validation %"
            value={analytics.platformHealth.projectsWithValidationPercent}
          />
          <SummaryCard
            label="Validation Completion %"
            value={analytics.platformHealth.validationCompletionPercent}
          />
          <SummaryCard
            label="Average Reviews per Validation"
            value={analytics.platformHealth.averageReviewsPerValidation}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <RankingList
            title="Most active reviewers"
            items={analytics.mostActiveReviewers}
            emptyLabel="No reviewers yet."
            hrefFor={() => "/admin/reviews"}
          />
          <RankingList
            title="Most validated projects"
            items={analytics.mostValidatedProjects}
            emptyLabel="No validation requests yet."
            hrefFor={() => "/admin/projects"}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Validation analytics
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Open"
            value={analytics.validationAnalytics.open}
            href="/admin/validations?status=open"
          />
          <SummaryCard
            label="In review"
            value={analytics.validationAnalytics.inReview}
            href="/admin/validations?status=in_review"
          />
          <SummaryCard
            label="Completed"
            value={analytics.validationAnalytics.completed}
            href="/admin/validations?status=completed"
          />
          <SummaryCard
            label="Avg completion (hours)"
            value={analytics.validationAnalytics.averageCompletionHours ?? 0}
            empty={analytics.validationAnalytics.averageCompletionHours == null}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Average completion uses completed reputation events vs request created
          time
          {analytics.validationAnalytics.sampleSize
            ? ` · ${analytics.validationAnalytics.sampleSize} completed requests`
            : " · no completed timings yet"}
          .
        </p>
        <RankingList
          title="Validation requests by status"
          items={Object.entries(analytics.validationsByStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({
              label,
              value,
            }))}
          emptyLabel="No validation requests yet."
          hrefFor={(item) =>
            `/admin/validations?status=${encodeURIComponent(item.label)}`
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Geography</h3>
          <p className="text-sm text-muted-foreground">
            Parsed from profile location, with structured city/country used
            when those fields exist.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard label="Countries" value={analytics.geography.countries} href="/admin/users" />
          <SummaryCard label="Cities" value={analytics.geography.cities} href="/admin/users" />
          <SummaryCard label="Regions" value={analytics.geography.regions} href="/admin/users" />
          <SummaryCard
            label="Users with location"
            value={analytics.geography.withLocation}
            href="/admin/users"
          />
          <SummaryCard
            label="Unspecified"
            value={analytics.geography.unspecified}
            href="/admin/users?country=Unspecified"
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <RankingList
            title="Top countries"
            items={analytics.topCountries}
            emptyLabel="No country data yet."
            hrefFor={(item) =>
              `/admin/users?country=${encodeURIComponent(item.label)}`
            }
          />
          <RankingList
            title="Top cities"
            items={analytics.topCities}
            emptyLabel="No city data yet."
            hrefFor={(item) =>
              `/admin/users?city=${encodeURIComponent(item.label)}`
            }
          />
          <RankingList
            title="Top regions"
            items={analytics.topRegions}
            emptyLabel="No region data yet."
            hrefFor={(item) =>
              `/admin/users?region=${encodeURIComponent(item.label)}`
            }
          />
          <RankingList
            title="Users by country"
            items={analytics.usersByCountry}
            emptyLabel="No location data yet."
            hrefFor={(item) =>
              `/admin/users?country=${encodeURIComponent(item.label)}`
            }
          />
          <RankingList
            title="Users by city"
            items={analytics.usersByCity}
            emptyLabel="No location data yet."
            hrefFor={(item) =>
              `/admin/users?city=${encodeURIComponent(item.label)}`
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">Platform mix</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          <RankingList
            title="Projects by category"
            items={analytics.projectsByCategory}
            emptyLabel="No projects yet."
            hrefFor={(item) =>
              `/admin/projects?category=${encodeURIComponent(item.label)}`
            }
          />
          <RankingList
            title="Projects by status"
            items={Object.entries(analytics.projectsByStatus).map(
              ([label, value]) => ({ label, value }),
            )}
            emptyLabel="No projects yet."
            hrefFor={(item) =>
              `/admin/projects?status=${encodeURIComponent(item.label)}`
            }
          />
          <RankingList
            title="Users by status"
            items={Object.entries(analytics.usersByStatus).map(
              ([label, value]) => ({ label, value }),
            )}
            emptyLabel="No users yet."
            hrefFor={(item) =>
              `/admin/users?status=${encodeURIComponent(item.label)}`
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Top builders by reputation
        </h3>
        {analytics.topBuilders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No reputation data yet.
          </p>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="divide-y divide-border p-0">
              {analytics.topBuilders.map((row, index) => {
                const name = hasProfileValue(row.profile.full_name)
                  ? row.profile.full_name
                  : `@${row.profile.username}`;
                return (
                  <Link
                    key={row.profile.id}
                    href={`/admin/users/${row.profile.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-accent/40"
                  >
                    <span className="min-w-0 truncate">
                      <span className="mr-2 tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                      {name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {row.level}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {row.points} pts
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  empty = false,
  href,
}: {
  label: string;
  value: number;
  empty?: boolean;
  href?: string;
}) {
  const card = (
    <Card className="h-full shadow-sm transition-colors hover:bg-accent/40">
      <CardContent className="p-4 sm:p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
          {empty ? "—" : value}
        </p>
      </CardContent>
    </Card>
  );
  if (!href) return card;
  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}

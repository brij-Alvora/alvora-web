import { redirect } from "next/navigation";

import { DiscoverActivity } from "@/components/discover/discover-activity";
import { DiscoverBuilders } from "@/components/discover/discover-builders";
import { DiscoverMentors } from "@/components/discover/discover-mentors";
import { DiscoverProjectCard } from "@/components/discover/discover-project-card";
import { DiscoverRequestList } from "@/components/discover/discover-request-list";
import { firstParam, matchesQuery, type SearchValues } from "@/lib/admin/params";
import { getDiscoverFeed } from "@/lib/discover/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function DiscoverPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/discover");

  const params = await searchParams;
  const q = firstParam(params, "q");
  const feed = await getDiscoverFeed(user.id);
  const published =
    feed.recommended.length > 0 ? feed.recommended : feed.projects;
  const requests = feed.openRequests.filter((request) =>
    matchesQuery(
      [request.request_title, request.project?.title, request.builder?.username]
        .filter(Boolean)
        .join(" "),
      q,
    ),
  );
  const projects = published.filter((project) =>
    matchesQuery(
      [project.title, project.category, project.builder?.username]
        .filter(Boolean)
        .join(" "),
      q,
    ),
  );
  const builders = feed.topBuilders.filter((row) =>
    matchesQuery(
      [row.profile.username, row.profile.full_name, row.level]
        .filter(Boolean)
        .join(" "),
      q,
    ),
  );
  const mentors = feed.foundingMentors.filter((row) =>
    matchesQuery(
      [
        row.profile.username,
        row.profile.full_name,
        row.profile.headline,
        ...row.profile.expertise,
      ]
        .filter(Boolean)
        .join(" "),
      q,
    ),
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Discovery</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Discover
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Review open work, then explore published projects and builders.
          </p>
        </div>
        <form className="flex w-full gap-2 sm:max-w-sm" action="/discover">
          <Input name="q" defaultValue={q} placeholder="Search projects, requests, builders" />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Featured Founding Mentors
          </h2>
          <p className="text-sm text-muted-foreground">
            Invited experts selected to help establish trusted project reviews.
          </p>
        </div>
        <DiscoverMentors
          mentors={mentors}
          emptyMessage={
            q && feed.foundingMentors.length > 0
              ? "No founding mentors match this search."
              : "No founding mentors yet."
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Needs review
          </h2>
          <p className="text-sm text-muted-foreground">
            Open and in-review validation requests from other builders.
          </p>
        </div>
        <DiscoverRequestList requests={requests} currentUserId={user.id} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Published projects
          </h2>
          <p className="text-sm text-muted-foreground">
            Live work from the community, newest first.
          </p>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No published projects match this search.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <DiscoverProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Top builders</h2>
          <p className="text-sm text-muted-foreground">
            Ranked by live reputation points.
          </p>
        </div>
        <DiscoverBuilders builders={builders} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Recent platform activity
          </h2>
          <p className="text-sm text-muted-foreground">
            Publishes, validation requests, reviews, and completions.
          </p>
        </div>
        <DiscoverActivity items={feed.activity} />
      </section>
    </div>
  );
}

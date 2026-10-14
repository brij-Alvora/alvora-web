import { redirect } from "next/navigation";

import { DiscoverActivity } from "@/components/discover/discover-activity";
import { DiscoverBuilders } from "@/components/discover/discover-builders";
import { DiscoverProjectCard } from "@/components/discover/discover-project-card";
import { DiscoverRequestList } from "@/components/discover/discover-request-list";
import { getDiscoverFeed } from "@/lib/discover/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover · Alvora",
};

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const feed = await getDiscoverFeed(user.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-sm font-medium text-primary">Discovery</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Discover
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Find published projects, open reviews, and the builders leading the
          network.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Recent projects
          </h2>
          <p className="text-sm text-muted-foreground">
            Newest published work from the community.
          </p>
        </div>
        {feed.projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No published projects yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {feed.projects.map((project) => (
              <DiscoverProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Recommended for you
          </h2>
          <p className="text-sm text-muted-foreground">
            Published projects from other builders, newest first.
          </p>
        </div>
        {feed.recommended.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No published projects from other builders yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {feed.recommended.map((project) => (
              <DiscoverProjectCard
                key={project.id}
                project={project}
                showPublishedDate={false}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Open validation requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Requests waiting for a review.
          </p>
        </div>
        <DiscoverRequestList
          requests={feed.openRequests}
          currentUserId={user.id}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Top builders</h2>
          <p className="text-sm text-muted-foreground">
            Ranked by live reputation points.
          </p>
        </div>
        <DiscoverBuilders builders={feed.topBuilders} />
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

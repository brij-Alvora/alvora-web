import Link from "next/link";

import { DiscoverMentors } from "@/components/discover/discover-mentors";
import { DiscoverProjectProofCard } from "@/components/discover/discover-project-proof-card";
import { DiscoverTabs } from "@/components/discover/discover-tabs";
import { firstParam, matchesQuery, type SearchValues } from "@/lib/admin/params";
import { parseDiscoverTab } from "@/lib/discover/presentation";
import {
  builderLabel,
  getPublicDiscoverCatalog,
} from "@/lib/discover/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover · Alvora",
  description:
    "Browse Founding Mentors and published projects with review status before you sign up.",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function DiscoverPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const q = firstParam(params, "q");
  const tab = parseDiscoverTab(firstParam(params, "tab"));
  const catalog = await getPublicDiscoverCatalog();

  const mentors = catalog.mentors.filter((mentor) =>
    matchesQuery(
      [
        mentor.profile.username,
        mentor.profile.full_name,
        mentor.profile.headline,
        ...mentor.profile.expertise,
        ...mentor.reviewedProjects.map((project) => project.title),
      ]
        .filter(Boolean)
        .join(" "),
      q,
    ),
  );
  const projects = catalog.projects.filter((project) =>
    matchesQuery(
      [
        project.title,
        project.category,
        project.builder?.username,
        builderLabel(project.builder),
        project.reviewerName,
        project.reviewSummary,
      ]
        .filter(Boolean)
        .join(" "),
      q,
    ),
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Discovery</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Discover
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            See the mentors, published work, and written reviews on Alvora.
            Requesting a review requires an account.
          </p>
        </div>
        <form className="flex w-full gap-2 sm:max-w-sm" action="/discover">
          {tab !== "mentors" ? (
            <input type="hidden" name="tab" value={tab} />
          ) : null}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search mentors and projects"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <DiscoverTabs
        active={tab}
        mentorCount={mentors.length}
        projectCount={projects.length}
        query={q}
      />

      {tab === "mentors" ? (
        <section className="space-y-3" aria-labelledby="mentors-heading">
          <div>
            <h2 id="mentors-heading" className="text-lg font-semibold tracking-tight">
              Mentors
            </h2>
            <p className="text-sm text-muted-foreground">
              Founding Mentors selected to set the review standard.
            </p>
          </div>
          <DiscoverMentors
            mentors={mentors}
            emptyMessage={
              q && catalog.mentors.length > 0
                ? "No mentors match this search."
                : "Founding Mentors appear here after the Alvora team grants recognition."
            }
          />
          {catalog.mentors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Link href="/founding-mentors" className="font-medium underline underline-offset-4">
                Become a Founding Mentor
              </Link>
            </p>
          ) : null}
        </section>
      ) : (
        <section className="space-y-3" aria-labelledby="projects-heading">
          <div>
            <h2
              id="projects-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Projects
            </h2>
            <p className="text-sm text-muted-foreground">
              Published work, review status, and the latest written judgment.
            </p>
          </div>
          {projects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              {q && catalog.projects.length > 0
                ? "No published projects match this search."
                : "Published projects appear here once builders ship work."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <DiscoverProjectProofCard
                  key={project.id}
                  project={project}
                  signedIn={Boolean(user)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

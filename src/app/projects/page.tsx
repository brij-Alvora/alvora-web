import Link from "next/link";
import { redirect } from "next/navigation";

import { ContributionList } from "@/components/projects/contribution-list";
import { ProjectCard } from "@/components/projects/project-card";
import { WorkspaceFeed } from "@/components/projects/workspace-feed";
import { WorkspaceKpis } from "@/components/projects/workspace-kpis";
import {
  filterWorkspaceProjects,
  parseWorkspaceFocus,
  workspaceFocusTitle,
} from "@/lib/projects/workspace-focus";
import { getWorkspaceDashboard } from "@/lib/projects/workspace";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Projects · Alvora",
};

type PageProps = {
  searchParams: Promise<{ focus?: string }>;
};

export default async function MyProjectsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { focus: focusParam } = await searchParams;
  const focus = parseWorkspaceFocus(focusParam);
  const dashboard = await getWorkspaceDashboard();
  const projects = filterWorkspaceProjects(dashboard.performances, focus);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance, feedback, and reputation for the work you ship.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Create project</Link>
        </Button>
      </div>

      <WorkspaceKpis totals={dashboard.totals} focus={focus} />

      <section id="projects" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {workspaceFocusTitle(focus)}
          </h2>
          {focus ? (
            <Link
              href="/projects"
              className="text-sm font-medium text-primary hover:underline"
            >
              Show all
            </Link>
          ) : null}
        </div>
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {focus
              ? "No projects match this filter."
              : "No projects yet. Create your first project to start your showcase."}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((performance) => (
              <ProjectCard
                key={performance.project.id}
                project={performance.project}
                performance={performance}
                showOwnerActions
              />
            ))}
          </div>
        )}
      </section>

      <div id="recent-feedback">
        <WorkspaceFeed items={dashboard.feed} />
      </div>

      {dashboard.contributions.length > 0 ? (
        <ContributionList
          contributions={dashboard.contributions.slice(0, 6)}
          href="/projects/given"
        />
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectCard } from "@/components/projects/project-card";
import { getMyProjects } from "@/lib/project/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Projects · Alvora",
};

export default async function MyProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const projects = await getMyProjects();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft, publish, and manage your builder showcase.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Create project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No projects yet. Create your first project to start your showcase.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              showOwnerActions
            />
          ))}
        </div>
      )}
    </div>
  );
}

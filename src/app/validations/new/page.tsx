import { redirect } from "next/navigation";

import { ValidationRequestForm } from "@/components/validation/validation-request-form";
import {
  getAccessibleProject,
  getMyProjects,
} from "@/lib/project/queries";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/supabase/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "New validation request · Alvora",
};

type PageProps = {
  searchParams: Promise<{ project_id?: string }>;
};

export default async function NewValidationRequestPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { project_id: projectId } = await searchParams;
  const mine = await getMyProjects();
  const projects: Project[] = [...mine];

  if (projectId && !projects.some((project) => project.id === projectId)) {
    const extra = await getAccessibleProject(projectId);
    if (extra) projects.unshift(extra);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Request validation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Associate a project, choose a review type, and describe what you need.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
          <CardDescription>
            New requests start as Open. You can move them to In Review or Completed later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValidationRequestForm
            projects={projects}
            defaultProjectId={projectId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

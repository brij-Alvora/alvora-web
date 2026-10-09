import { notFound, redirect } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { getProjectByIdForOwner } from "@/lib/project/queries";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Edit project · Alvora",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const project = await getProjectByIdForOwner(id);
  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Edit project
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update details, save a draft, or publish to /project/{project.slug}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>Current status: {project.status}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}

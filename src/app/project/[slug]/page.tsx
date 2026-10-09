import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectView } from "@/components/projects/project-view";
import { getPublishedProjectBySlug } from "@/lib/project/queries";
import { getProfileByAuthId } from "@/lib/profile/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return { title: "Project not found · Alvora" };
  return {
    title: `${project.title} · Alvora`,
    description: project.short_description ?? project.description ?? undefined,
  };
}

export default async function PublicProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  const owner = await getProfileByAuthId(project.owner_id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <ProjectView project={project} owner={owner} />
    </div>
  );
}

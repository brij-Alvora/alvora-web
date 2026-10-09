"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteProjectAction,
  setProjectStatusAction,
} from "@/lib/actions/project";
import type { Project } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";

type ProjectCardProps = {
  project: Project;
  showOwnerActions?: boolean;
};

export function ProjectCard({
  project,
  showOwnerActions = false,
}: ProjectCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (task: () => Promise<unknown>) => {
    startTransition(async () => {
      await task();
      router.refresh();
    });
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <ProjectThumbnail
        src={project.thumbnail_url}
        alt={project.title}
        variant="card"
      />
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight">
              {project.title}
            </h3>
            {project.short_description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {project.short_description}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
            {project.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.status === "published" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/project/${project.slug}`}>View</Link>
            </Button>
          ) : null}
          {showOwnerActions ? (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${project.id}/edit`}>Edit</Link>
              </Button>
              {project.status !== "published" ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    run(() => setProjectStatusAction(project.id, "published"))
                  }
                >
                  Publish
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    run(() => setProjectStatusAction(project.id, "archived"))
                  }
                >
                  Archive
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Delete this project? This cannot be undone.")) {
                    run(() => deleteProjectAction(project.id));
                  }
                }}
              >
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

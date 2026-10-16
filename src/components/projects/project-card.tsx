"use client";

import Link from "next/link";

import { reputationContributionLabel } from "@/lib/projects/performance";
import type { ProjectPerformance } from "@/lib/projects/performance";
import type { Project } from "@/lib/supabase/types";
import { FeedbackSnapshotBlock } from "@/components/projects/feedback-snapshot";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectHealthBadge } from "@/components/projects/project-health";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";

type ProjectCardProps = {
  project: Project;
  showOwnerActions?: boolean;
  performance?: ProjectPerformance;
};

export function ProjectCard({
  project,
  showOwnerActions = false,
  performance,
}: ProjectCardProps) {
  const metrics = performance
    ? [
        {
          label: "Avg rating",
          value:
            performance.ratingAverage != null
              ? `${performance.ratingAverage}/5`
              : "—",
        },
        { label: "Reviews", value: String(performance.reviewCount) },
        { label: "Completed", value: String(performance.completedCount) },
        { label: "Pending", value: String(performance.pendingCount) },
      ]
    : [];

  const contribution = performance
    ? reputationContributionLabel(
        performance.reviewCount,
        performance.completedCount,
      )
    : null;

  return (
    <Card className="overflow-hidden shadow-sm">
      <ProjectThumbnail
        src={project.thumbnail_url}
        alt={project.title}
        variant="card"
      />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight">
              {project.title}
            </h3>
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
              {project.status}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {performance ? (
              <ProjectHealthBadge health={performance.health} />
            ) : null}
            {showOwnerActions ? <ProjectActionsMenu project={project} /> : null}
          </div>
        </div>

        {metrics.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((item) => (
              <div key={item.label}>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {performance ? (
          <div className="space-y-2 border-t border-border/70 pt-3">
            {performance.reputationPoints > 0 ? (
              <div>
                <p className="text-sm font-medium">
                  +{performance.reputationPoints} reputation
                </p>
                {contribution ? (
                  <p className="text-xs text-muted-foreground">{contribution}</p>
                ) : null}
              </div>
            ) : null}
            <FeedbackSnapshotBlock snapshot={performance.snapshot} compact />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {showOwnerActions ? (
            <Button asChild size="sm">
              <Link href={`/projects/${project.id}/feedback`}>
                View feedback
              </Link>
            </Button>
          ) : null}
          {project.status === "published" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/project/${project.slug}`}>View</Link>
            </Button>
          ) : null}
          {showOwnerActions && project.status === "published" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/validations/new?project_id=${project.id}`}>
                Validate
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

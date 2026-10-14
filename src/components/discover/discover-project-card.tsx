import Link from "next/link";

import { formatDiscoverDate } from "@/lib/discover/format";
import { builderLabel } from "@/lib/discover/queries";
import type { DiscoverProject } from "@/lib/discover/queries";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverProjectCardProps = {
  project: DiscoverProject;
  showPublishedDate?: boolean;
};

export function DiscoverProjectCard({
  project,
  showPublishedDate = true,
}: DiscoverProjectCardProps) {
  const published = project.published_at || project.created_at;
  const builder = project.builder;

  return (
    <Link href={`/project/${project.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden shadow-sm transition-colors hover:bg-accent/40">
        <ProjectThumbnail
          src={project.thumbnail_url}
          alt={project.title}
          variant="card"
        />
        <CardContent className="space-y-2 p-4">
          <h3 className="truncate font-semibold tracking-tight">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {builder?.username ? (
              <span>@{builder.username}</span>
            ) : (
              builderLabel(builder)
            )}
            {project.category ? ` · ${project.category}` : ""}
          </p>
          {showPublishedDate ? (
            <p className="text-xs text-muted-foreground">
              Published {formatDiscoverDate(published)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

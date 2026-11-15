import Link from "next/link";

import { formatDiscoverDate } from "@/lib/discover/format";
import {
  PROJECT_REVIEW_STATUS_LABEL,
  loginNextHref,
} from "@/lib/discover/presentation";
import { builderLabel, type DiscoverProjectProof } from "@/lib/discover/queries";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverProjectProofCardProps = {
  project: DiscoverProjectProof;
  signedIn: boolean;
};

export function DiscoverProjectProofCard({
  project,
  signedIn,
}: DiscoverProjectProofCardProps) {
  const published = project.published_at || project.created_at;
  const builder = project.builder;
  const projectHref = `/project/${project.slug}`;
  const requestHref = `/validations/new?project_id=${project.id}`;
  const actionHref = signedIn ? requestHref : loginNextHref(requestHref);
  const reviewerHref = project.reviewerUsername
    ? `/u/${project.reviewerUsername}`
    : null;

  return (
    <Card className="h-full overflow-hidden shadow-sm">
      <Link href={projectHref} className="block">
        <ProjectThumbnail
          src={project.thumbnail_url}
          alt={project.title}
          variant="card"
        />
      </Link>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {PROJECT_REVIEW_STATUS_LABEL[project.reviewStatus]}
          </p>
          <h3 className="font-semibold tracking-tight">
            <Link href={projectHref} className="hover:underline">
              {project.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">
            {builder?.username ? (
              <Link href={`/u/${builder.username}`} className="hover:underline">
                @{builder.username}
              </Link>
            ) : (
              builderLabel(builder)
            )}
            {project.category ? ` · ${project.category}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Published {formatDiscoverDate(published)}
          </p>
        </div>

        {project.reviewStatus === "reviewed" ? (
          <div className="space-y-1 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Reviewer{" "}
              {project.reviewerName ? (
                reviewerHref ? (
                  <Link
                    href={reviewerHref}
                    className="text-foreground hover:underline"
                  >
                    {project.reviewerName}
                  </Link>
                ) : (
                  <span className="text-foreground">{project.reviewerName}</span>
                )
              ) : (
                <span className="text-foreground">Named reviewer</span>
              )}
            </p>
            <p className="text-sm leading-6 text-foreground">
              {project.reviewSummary ?? "A written review is on this project."}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {project.reviewStatus === "in_review"
              ? "A mentor is reviewing this work."
              : "No written review yet."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={projectHref}>View project</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={actionHref}>
              {signedIn ? "Request a review" : "Sign in to request a review"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

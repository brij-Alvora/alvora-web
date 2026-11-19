import Link from "next/link";

import { SignupGate } from "@/components/discover/signup-gate";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMarketplaceDate, formatRating } from "@/lib/discover/format";
import { builderLabel } from "@/lib/discover/presentation";
import type { DiscoverProjectProof } from "@/lib/discover/queries";

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
  const reviewsHref = `${projectHref}#reviews`;
  const requestHref = `/validations/new?project_id=${project.id}`;
  const rating = formatRating(project.averageRating);

  return (
    <Card className="h-full overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <Link href={projectHref} className="block">
        <ProjectThumbnail
          src={project.thumbnail_url}
          alt={project.title}
          variant="card"
        />
      </Link>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {project.featured ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Featured
            </span>
          ) : null}
          {project.category ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {project.category}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold tracking-tight">
            <Link href={projectHref} className="hover:underline">
              {project.title}
            </Link>
          </h3>
          {project.short_description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {project.short_description}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {builder?.username ? (
              <Link href={`/u/${builder.username}`} className="hover:underline">
                {builderLabel(builder)}
              </Link>
            ) : (
              builderLabel(builder)
            )}
          </p>
        </div>
        {project.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline">Added </dt>
            <dd className="inline text-foreground">{formatMarketplaceDate(published)}</dd>
          </div>
          <div>
            <dt className="inline">Reviews </dt>
            <dd className="inline tabular-nums text-foreground">{project.reviewCount}</dd>
          </div>
          <div>
            <dt className="inline">Score </dt>
            <dd className="inline tabular-nums text-foreground">{rating ?? "—"}</dd>
          </div>
          <div>
            <dt className="inline">Reviewers </dt>
            <dd className="inline tabular-nums text-foreground">{project.mentorCount}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={projectHref}>View Project</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={reviewsHref}>Read Reviews</Link>
          </Button>
          <SignupGate signedIn={signedIn} href={requestHref}>
            Request review
          </SignupGate>
        </div>
      </CardContent>
    </Card>
  );
}

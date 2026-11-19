import Link from "next/link";

import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { builderLabel } from "@/lib/discover/presentation";
import type { DiscoverProjectProof } from "@/lib/discover/queries";

type DiscoverFeaturedCarouselProps = {
  projects: DiscoverProjectProof[];
};

export function DiscoverFeaturedCarousel({
  projects,
}: DiscoverFeaturedCarouselProps) {
  if (projects.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="featured-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="featured-heading" className="text-lg font-semibold tracking-tight">
            Featured Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            Work with named, written reviews — not upvotes.
          </p>
        </div>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {projects.map((project) => (
          <li
            key={project.id}
            className="w-[min(80vw,18rem)] shrink-0 snap-start sm:w-72"
          >
            <Link
              href={`/project/${project.slug}`}
              className="block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <ProjectThumbnail
                src={project.thumbnail_url}
                alt={project.title}
                variant="card"
              />
              <div className="space-y-1 p-3">
                <p className="truncate font-semibold tracking-tight">{project.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {builderLabel(project.builder)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.reviewCount}{" "}
                  {project.reviewCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

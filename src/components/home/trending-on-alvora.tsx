import Link from "next/link";

import { builderLabel } from "@/lib/discover/presentation";
import type { DiscoverMentor, DiscoverProjectProof } from "@/lib/discover/queries";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";
import { hasProfileValue } from "@/lib/profile/presentation";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TrendingOnAlvoraProps = {
  projects: DiscoverProjectProof[];
  mentors: DiscoverMentor[];
};

export function TrendingOnAlvora({ projects, mentors }: TrendingOnAlvoraProps) {
  if (projects.length === 0 && mentors.length === 0) return null;

  return (
    <section
      aria-labelledby="trending-heading"
      className="border-t border-border/60"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="trending-heading"
              className="text-xl font-semibold tracking-tight sm:text-2xl"
            >
              Trending on Alvora
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Work with written reviews, and mentors already earning public trust.
            </p>
          </div>
          <Link
            href="/discover"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View More → Discover
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Top projects
            </h3>
            <ul className="grid gap-3 sm:grid-cols-3">
              {projects.map((project) => (
                <li key={project.id}>
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
                      <p className="truncate font-semibold tracking-tight">
                        {project.title}
                      </p>
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
          </div>
        ) : null}

        {mentors.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Top mentors
            </h3>
            <ul className="grid gap-3 sm:grid-cols-3">
              {mentors.map((mentor) => {
                const name = builderLabel(mentor.profile);
                return (
                  <li key={mentor.profile.id}>
                    <Link
                      href={`/u/${mentor.profile.username}`}
                      className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <Avatar className="h-11 w-11 border border-border">
                        {hasProfileValue(mentor.profile.avatar_url) ? (
                          <AvatarImage src={mentor.profile.avatar_url} alt={name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {mentor.reviewsGiven} reviews
                          {mentor.profile.is_founding_mentor
                            ? " · Founding Mentor"
                            : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

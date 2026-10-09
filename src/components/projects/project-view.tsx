import { Code2, ExternalLink } from "lucide-react";
import Link from "next/link";

import type { Profile } from "@/lib/supabase/types";
import type { Project } from "@/lib/supabase/types";
import { hasProfileValue } from "@/lib/profile/presentation";
import { displayUrlHost } from "@/lib/profile/presentation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";

type ProjectViewProps = {
  project: Project;
  owner: Profile | null;
};

export function ProjectView({ project, owner }: ProjectViewProps) {
  const links = [
    project.demo_url
      ? { href: project.demo_url, label: "Live demo", icon: ExternalLink }
      : null,
    project.github_url
      ? { href: project.github_url, label: "GitHub", icon: Code2 }
      : null,
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: typeof ExternalLink;
  }[];

  return (
    <article className="mx-auto w-full max-w-[52rem] space-y-4">
      <Card className="overflow-hidden shadow-sm">
        <ProjectThumbnail
          src={project.thumbnail_url}
          alt={project.title}
          variant="hero"
        />
        <CardContent className="space-y-4 p-5 sm:p-8">
          <div className="space-y-2">
            {project.category ? (
              <p className="text-sm font-medium text-primary">
                {project.category}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {project.title}
            </h1>
            {project.short_description ? (
              <p className="text-base text-foreground/80">
                {project.short_description}
              </p>
            ) : null}
          </div>

          {owner ? (
            <p className="text-sm text-muted-foreground">
              By{" "}
              <Link
                href={`/u/${owner.username}`}
                className="font-medium text-foreground hover:underline"
              >
                {hasProfileValue(owner.full_name)
                  ? owner.full_name
                  : `@${owner.username}`}
              </Link>
            </p>
          ) : null}

          {project.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {links.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Button key={link.href} asChild variant="outline" size="sm">
                  <Link href={link.href} target="_blank" rel="noopener noreferrer">
                    <link.icon />
                    {link.label}
                    <span className="hidden text-muted-foreground sm:inline">
                      {displayUrlHost(link.href)}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {project.description ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">About</h2>
            <Separator />
            <p className="whitespace-pre-wrap text-[0.95rem] leading-7 text-foreground/90">
              {project.description}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </article>
  );
}

import Link from "next/link";

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  compareDate,
  compareText,
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminProjects } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin projects · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const sort = firstParam(params, "sort") || "newest";
  const category = firstParam(params, "category");
  const status = firstParam(params, "status");
  const projects = await getAdminProjects();

  const filtered = projects
    .filter((project) => {
      const haystack = [
        project.title,
        project.slug,
        project.category,
        project.status,
        project.owner?.username,
        project.owner?.full_name,
      ]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (category && (project.category ?? "") !== category) return false;
      if (status && project.status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return compareDate(a.created_at, b.created_at);
      if (sort === "title") return compareText(a.title, b.title);
      return compareDate(b.created_at, a.created_at);
    });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {projects.length}{" "}
          {projects.length === 1 ? "project" : "projects"}
          {category ? ` · ${category}` : ""}
          {status ? ` · ${status}` : ""}
        </p>
      </div>
      <AdminToolbar
        placeholder="Search title, owner, category"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "title", label: "Title" },
        ]}
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No projects match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((project) => {
            const owner = project.owner;
            const ownerName = owner
              ? hasProfileValue(owner.full_name)
                ? owner.full_name
                : `@${owner.username}`
              : "Owner";
            return (
              <li key={project.id}>
                <Card className="shadow-sm">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.category ?? "Uncategorized"} · {project.status} ·{" "}
                        {ownerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDiscoverDate(project.created_at)}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/projects/${project.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

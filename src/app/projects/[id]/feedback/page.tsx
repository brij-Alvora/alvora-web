import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FeedbackSnapshotBlock } from "@/components/projects/feedback-snapshot";
import { ProjectHealthBadge } from "@/components/projects/project-health";
import { ReviewList } from "@/components/review/review-list";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectByIdForOwner } from "@/lib/project/queries";
import { getProjectInsights } from "@/lib/projects/workspace";
import { getReviewsForProject } from "@/lib/review/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Project feedback · Alvora",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectFeedbackPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const project = await getProjectByIdForOwner(id);
  if (!project) notFound();

  const [insights, reviews] = await Promise.all([
    getProjectInsights(project.id),
    getReviewsForProject(project.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/projects" className="hover:underline">
              My Projects
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {project.title}
            </h1>
            {insights ? <ProjectHealthBadge health={insights.health} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {insights?.ratingAverage != null
              ? `${insights.ratingAverage}/5 average · `
              : "No rating yet · "}
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Back to workspace</Link>
        </Button>
      </div>

      {insights ? (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium">Latest feedback</p>
            <div className="mt-3">
              <FeedbackSnapshotBlock snapshot={insights.snapshot} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ReviewList
        reviews={reviews}
        emptyMessage="No reviews yet. Request validation to collect feedback on this project."
      />
    </div>
  );
}

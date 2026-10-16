import type { ProjectPerformance } from "@/lib/projects/performance";
import { FeedbackSnapshotBlock } from "@/components/projects/feedback-snapshot";
import { ProjectHealthBadge } from "@/components/projects/project-health";
import { Card, CardContent } from "@/components/ui/card";

const TREND_LABEL = {
  up: "Ratings are improving",
  down: "Ratings have dipped",
  steady: "Ratings are holding steady",
  new: "Not enough reviews for a trend",
};

export function ProjectInsights({
  performance,
}: {
  performance: ProjectPerformance;
}) {
  const metrics = [
    {
      label: "Avg rating",
      value:
        performance.ratingAverage != null
          ? `${performance.ratingAverage}/5`
          : "—",
    },
    { label: "Reviews", value: performance.reviewCount },
    { label: "Completed", value: performance.completedCount },
    { label: "Pending", value: performance.pendingCount },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Project performance
            </h2>
            <ProjectHealthBadge health={performance.health} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {TREND_LABEL[performance.trend]}
            {performance.reputationPoints > 0
              ? ` · +${performance.reputationPoints} reputation from this project`
              : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/70 px-3 py-2"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <FeedbackSnapshotBlock snapshot={performance.snapshot} />
      </CardContent>
    </Card>
  );
}

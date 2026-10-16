import {
  CircleCheck,
  MessageSquare,
  PenLine,
  Star,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { ReputationKpi } from "@/components/projects/reputation-kpi";
import type { WorkspaceFocus } from "@/lib/projects/workspace-focus";
import type { WorkspaceDashboard } from "@/lib/projects/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkspaceKpisProps = {
  totals: WorkspaceDashboard["totals"];
  focus: WorkspaceFocus | null;
};

type KpiItem = {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  focus?: WorkspaceFocus | "given";
};

export function WorkspaceKpis({ totals, focus }: WorkspaceKpisProps) {
  const items: KpiItem[] = [
    {
      label: "Avg rating",
      value: totals.averageScore != null ? `${totals.averageScore}/5` : "—",
      href: "/projects?focus=rated",
      icon: Star,
      focus: "rated",
    },
    {
      label: "Reviews received",
      value: totals.reviewsReceived,
      href: "/projects?focus=reviews",
      icon: MessageSquare,
      focus: "reviews",
    },
    {
      label: "Validations received",
      value: totals.completedValidations,
      href: "/projects?focus=validated",
      icon: CircleCheck,
      focus: "validated",
    },
    {
      label: "Reviews given",
      value: totals.reviewsGiven,
      href: "/projects/given",
      icon: PenLine,
      focus: "given",
    },
    {
      label: "Needs Attention",
      value: totals.needingAttention,
      href: "/projects?focus=attention",
      icon: TriangleAlert,
      focus: "attention",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <ReputationKpi
        points={totals.reputationPoints}
        level={totals.reputationLevel}
        fromValidations={totals.reputationFromProjects}
        fromReviews={totals.reputationFromReviews}
      />
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.focus === focus;
        return (
          <Link key={item.label} href={item.href} className="block">
            <Card
              className={cn(
                "h-full shadow-sm transition-colors hover:bg-secondary/40",
                active && "border-primary ring-1 ring-primary/30",
              )}
            >
              <CardContent className="p-4">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

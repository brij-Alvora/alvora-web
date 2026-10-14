import Link from "next/link";

import type { GrowthMetric } from "@/lib/admin/queries";
import { Card, CardContent } from "@/components/ui/card";

const GROWTH_HREFS: Record<string, string> = {
  Users: "/admin/users",
  Projects: "/admin/projects",
  Validations: "/admin/validations",
  Reviews: "/admin/reviews",
};

type GrowthTableProps = {
  title: string;
  caption: string;
  metrics: GrowthMetric[];
};

export function GrowthTable({ title, caption, metrics }: GrowthTableProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{caption}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Metric</th>
                <th className="py-2 pr-3 font-medium">Current</th>
                <th className="py-2 pr-3 font-medium">Previous</th>
                <th className="py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.label} className="border-t border-border">
                  <td className="py-2.5 pr-3 font-medium">
                    {GROWTH_HREFS[metric.label] ? (
                      <Link
                        href={GROWTH_HREFS[metric.label]}
                        className="hover:underline"
                      >
                        {metric.label}
                      </Link>
                    ) : (
                      metric.label
                    )}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{metric.current}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                    {metric.previous}
                  </td>
                  <td className="py-2.5 tabular-nums">
                    {metric.delta > 0 ? "+" : ""}
                    {metric.delta}
                    {metric.deltaPercent == null
                      ? metric.current > 0
                        ? " · new"
                        : ""
                      : ` · ${metric.deltaPercent > 0 ? "+" : ""}${metric.deltaPercent}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

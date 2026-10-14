import Link from "next/link";

import type { FunnelStep } from "@/lib/admin/queries";
import { Card, CardContent } from "@/components/ui/card";

const FUNNEL_HREFS: Record<string, string> = {
  signup: "/admin/users",
  profile: "/admin/users",
  project: "/admin/projects",
  validation: "/admin/validations",
  review: "/admin/reviews",
};

type FunnelProps = {
  steps: FunnelStep[];
};

export function Funnel({ steps }: FunnelProps) {
  const max = steps[0]?.value ?? 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-medium">Platform funnel</h3>
          <p className="text-sm text-muted-foreground">
            Unique people at each stage: signup → profile → project →
            validation → review.
          </p>
        </div>
        <ol className="space-y-3">
          {steps.map((step) => {
            const width = max > 0 ? Math.max(8, Math.round((step.value / max) * 100)) : 8;
            const href = FUNNEL_HREFS[step.key];
            const body = (
              <>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {step.value} · {step.percentOfSignup}% of signup
                    {step.key !== "signup" ? ` · ${step.percentOfPrevious}% of prior` : ""}
                  </span>
                </div>
                <div className="h-8 overflow-hidden rounded-md bg-secondary">
                  <div
                    className="flex h-full items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                    style={{ width: `${width}%` }}
                  >
                    {step.value}
                  </div>
                </div>
              </>
            );
            return (
              <li key={step.key} className="space-y-1.5">
                {href ? (
                  <Link href={href} className="block rounded-md hover:bg-accent/40">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

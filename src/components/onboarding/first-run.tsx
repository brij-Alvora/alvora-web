import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  flywheelSteps,
  nextFlywheelStep,
  type FlywheelProgress,
} from "@/lib/onboarding/flywheel";

type FirstRunProps = {
  progress: FlywheelProgress;
};

export function FirstRun({ progress }: FirstRunProps) {
  const steps = flywheelSteps(progress);
  const next = nextFlywheelStep(progress);
  if (!next) return null;

  const reviewer = progress.intent === "reviewer";

  return (
    <Card className="border-primary/30 shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Next step
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {reviewer
              ? "Join as a reviewer"
              : "Get a written review of your work"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviewer
              ? "Complete your profile, open the validation queue, and submit your first review."
              : "Complete your profile, publish a project, then request validation."}
          </p>
        </div>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  {index + 1}. {step.title}
                  {step.done ? " · Done" : ""}
                </p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
              {!step.done ? (
                <Button asChild size="sm" variant={step.id === next.id ? "default" : "outline"}>
                  <Link href={step.href}>{step.cta}</Link>
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

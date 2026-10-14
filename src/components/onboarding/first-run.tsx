import Link from "next/link";

import { PROFILE_COMPLETION_THRESHOLD } from "@/lib/reputation/rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FirstRunProps = {
  profilePercent: number;
  hasPublishedProject: boolean;
  hasValidationOrReview: boolean;
};

export function FirstRun({
  profilePercent,
  hasPublishedProject,
  hasValidationOrReview,
}: FirstRunProps) {
  const steps = [
    {
      done: profilePercent >= PROFILE_COMPLETION_THRESHOLD,
      title: "Complete your profile",
      body: "Add a name, headline, and links so other builders can find you.",
      href: "/profile/edit",
      cta: "Edit profile",
    },
    {
      done: hasPublishedProject,
      title: "Publish a project",
      body: "Drafts stay private. Publishing puts your work on Discover.",
      href: "/projects/new",
      cta: "Create project",
    },
    {
      done: hasValidationOrReview,
      title: "Request or give a review",
      body: "Ask for validation on your project, or review an open request.",
      href: "/discover",
      cta: "Find a request",
    },
  ];

  if (steps.every((step) => step.done)) return null;

  return (
    <Card className="border-primary/30 shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Get started
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Three steps to join the network
          </h2>
        </div>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
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
                <Button asChild size="sm">
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

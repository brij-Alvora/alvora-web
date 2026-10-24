import {
  BadgeCheck,
  FolderKanban,
  Inbox,
  Pencil,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { FOUNDING_MENTOR_THANKS } from "@/lib/mentors/copy";
import { FirstRun } from "@/components/onboarding/first-run";
import { ProjectCard } from "@/components/projects/project-card";
import { ReputationCard } from "@/components/reputation/reputation-card";
import { ValidationRequestList } from "@/components/validation/validation-request-list";
import type { BuilderStats } from "@/lib/dashboard/stats";
import type { Profile } from "@/lib/supabase/types";
import type { Project } from "@/lib/supabase/types";
import type { ValidationRequestWithProject } from "@/lib/validation/queries";
import {
  getFirstName,
  getProfileCompletion,
  hasProfileValue,
} from "@/lib/profile/presentation";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type BuilderHomeProps = {
  email: string;
  profile: Profile | null;
  stats: BuilderStats;
  projects: Project[];
  validationRequests: ValidationRequestWithProject[];
};

export function BuilderHome({
  email,
  profile,
  stats,
  projects,
  validationRequests,
}: BuilderHomeProps) {
  const displayName = hasProfileValue(profile?.full_name)
    ? profile.full_name
    : hasProfileValue(profile?.username)
      ? profile.username
      : email.split("@")[0] ?? "Builder";
  const firstName = getFirstName(profile?.full_name, displayName);
  const completion = profile
    ? getProfileCompletion(profile)
    : { percent: 0, filled: 0, total: 9 };

  const statItems = [
    {
      label: "Projects",
      value: stats.projects,
      icon: FolderKanban,
    },
    {
      label: "Validation requests",
      value: stats.validationRequests,
      icon: ShieldCheck,
    },
    {
      label: "Reviews received",
      value: stats.reviewsReceived,
      icon: Inbox,
    },
    {
      label: "Reviews submitted",
      value: stats.reviewsSubmitted,
      icon: Send,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-10">
      <section className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Builder Home</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Your identity, stats, and next actions in one place.
          </p>
        </div>
        {profile?.username ? (
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        ) : null}
      </section>

      {profile?.is_founding_mentor ? (
        <FoundingMentorCredential statement={FOUNDING_MENTOR_THANKS} />
      ) : null}

      <FirstRun
        profilePercent={completion.percent}
        hasPublishedProject={projects.some(
          (project) => project.status === "published",
        )}
        hasValidationOrReview={
          stats.validationRequests > 0 || stats.reviewsSubmitted > 0
        }
      />

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar className="h-16 w-16 border border-border">
            {hasProfileValue(profile?.avatar_url) ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Profile
                </h2>
                <p className="text-sm text-muted-foreground">
                  {completion.percent === 100
                    ? "Your public builder identity is complete."
                    : "Finish your profile to strengthen your public identity."}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {completion.percent}%
              </p>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion.percent}
              aria-label="Profile completion"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completion.filled} of {completion.total} identity fields filled
            </p>

            <div className="flex flex-wrap gap-2">
              {profile?.username ? (
                <Button asChild variant="outline">
                  <Link href={`/u/${profile.username}`}>
                    <BadgeCheck />
                    View profile
                  </Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link href="/profile/edit">
                  <Pencil />
                  {profile ? "Edit profile" : "Create profile"}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Builder stats</h2>
          <p className="text-sm text-muted-foreground">
            Activity across projects, validation, and reputation.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statItems.map((item) => (
            <Card key={item.label} className="shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Reputation</h2>
          <p className="text-sm text-muted-foreground">
            Score and level are calculated from reputation events.
          </p>
        </div>
        <ReputationCard
          totalPoints={stats.reputation.total_points}
          level={stats.reputation.level}
          nextLevel={stats.reputation.next_level}
          progress={stats.reputation.progress}
          recentEvent={stats.reputation.events[0] ?? null}
          showHistoryLink
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">My Projects</h2>
            <p className="text-sm text-muted-foreground">
              Drafts stay private. Published projects appear at /project/[slug].
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">View all</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/projects/new">Create project</Link>
            </Button>
          </div>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No projects yet. Create one to start your showcase.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.slice(0, 4).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showOwnerActions
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recent validation requests
            </h2>
            <p className="text-sm text-muted-foreground">
              Track Open, In Review, and Completed reviews.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/validations">View all</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/validations/new">New request</Link>
            </Button>
          </div>
        </div>
        <ValidationRequestList
          requests={validationRequests}
          emptyLabel="No validation requests yet."
        />
      </section>
    </div>
  );
}

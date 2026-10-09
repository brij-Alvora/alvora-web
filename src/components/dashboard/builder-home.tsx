import {
  BadgeCheck,
  FolderKanban,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";

import type { BuilderStats } from "@/lib/dashboard/stats";
import type { Profile } from "@/lib/supabase/types";
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
};

export function BuilderHome({ email, profile, stats }: BuilderHomeProps) {
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
      label: "Reviews",
      value: stats.reviews,
      icon: MessageSquare,
    },
    {
      label: "Reputation",
      value: stats.reputation,
      icon: Star,
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
    </div>
  );
}

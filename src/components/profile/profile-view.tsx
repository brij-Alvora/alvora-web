import { Code2, ExternalLink, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { DiscoverProjectCard } from "@/components/discover/discover-project-card";
import { ExpertiseList } from "@/components/mentors/expertise-list";
import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { RecentAchievements } from "@/components/reputation/recent-achievements";
import type { DiscoverProject } from "@/lib/discover/queries";
import type { ReputationSnapshot } from "@/lib/reputation/calculator";
import type { Profile } from "@/lib/supabase/types";
import {
  displayUrlHost,
  formatJoinedDate,
  getProfileCompletion,
  hasProfileValue,
} from "@/lib/profile/presentation";
import { getInitials } from "@/lib/utils";
import { ReportButton } from "@/components/reports/report-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

type ProfileViewProps = {
  profile: Profile;
  reputation: ReputationSnapshot;
  projects?: DiscoverProject[];
  isOwner?: boolean;
};

type ProfileLink = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

export function ProfileView({
  profile,
  reputation,
  projects = [],
  isOwner = false,
}: ProfileViewProps) {
  const displayName = hasProfileValue(profile.full_name)
    ? profile.full_name
    : profile.username;
  const completion = getProfileCompletion(profile);
  const links: ProfileLink[] = [
    hasProfileValue(profile.website)
      ? {
          href: profile.website,
          label: "Website",
          detail: displayUrlHost(profile.website),
          icon: Globe,
        }
      : null,
    hasProfileValue(profile.github_url)
      ? {
          href: profile.github_url,
          label: "GitHub",
          detail: displayUrlHost(profile.github_url),
          icon: Code2,
        }
      : null,
    hasProfileValue(profile.linkedin_url)
      ? {
          href: profile.linkedin_url,
          label: "LinkedIn",
          detail: displayUrlHost(profile.linkedin_url),
          icon: ExternalLink,
        }
      : null,
  ].filter((link): link is ProfileLink => link !== null);

  return (
    <article className="mx-auto w-full max-w-[52rem] space-y-3 sm:space-y-4">
      <Card className="shadow-sm">
        <div
          aria-hidden
          className="h-24 rounded-t-xl bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_48%,#1c1917_100%)] sm:h-36"
        />

        <div className="px-4 pb-6 sm:px-8">
          <Avatar className="-mt-10 h-20 w-20 border-4 border-card shadow-sm sm:-mt-14 sm:h-28 sm:w-28">
            {hasProfileValue(profile.avatar_url) ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary sm:text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <header className="mt-4 space-y-2">
            <div>
              <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>
              {profile.is_founding_mentor ? (
                <div className="mt-3">
                  <FoundingMentorCredential />
                </div>
              ) : null}
              <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                @{profile.username}
              </p>
            </div>

            {hasProfileValue(profile.headline) ? (
              <p className="max-w-2xl text-[0.95rem] leading-relaxed text-foreground/85 sm:text-lg">
                {profile.headline}
              </p>
            ) : null}

            {profile.is_founding_mentor && profile.expertise.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Expertise
                </p>
                <ExpertiseList areas={profile.expertise} />
              </div>
            ) : null}

            {hasProfileValue(profile.location) ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span>{profile.location}</span>
              </p>
            ) : null}
            <ReportButton
              targetType="user"
              targetId={profile.user_id ?? profile.id}
            />
          </header>
        </div>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Reputation
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {reputation.level}
              </p>
              <p className="text-sm text-muted-foreground">
                {reputation.total_points}{" "}
                {reputation.total_points === 1 ? "point" : "points"}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {reputation.level}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Recent Achievements
            </h3>
            <div className="mt-2">
              <RecentAchievements events={reputation.events.slice(0, 5)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {projects.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <DiscoverProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No published projects yet.
        </p>
      )}

      {hasProfileValue(profile.bio) ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">About</h2>
            <p className="whitespace-pre-wrap text-[0.95rem] leading-7 text-foreground/90">
              {profile.bio}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {links.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">Links</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent sm:px-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <link.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {link.label}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {link.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {hasProfileValue(profile.created_at) || completion.total > 0 ? (
      <Card className="shadow-sm">
        <CardContent className="grid gap-5 p-4 sm:grid-cols-2 sm:items-center sm:p-6">
          {hasProfileValue(profile.created_at) ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Joined
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatJoinedDate(profile.created_at)}
            </p>
          </div>
          ) : null}

          {isOwner ? (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Profile completion
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {completion.percent}%
              </p>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion.percent}
              aria-label="Profile completion"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {completion.filled} of {completion.total} identity fields filled
            </p>
          </div>
          ) : null}
        </CardContent>
      </Card>
      ) : null}
    </article>
  );
}

import Link from "next/link";

import { StatCounter } from "@/components/discover/stat-counter";
import { Button } from "@/components/ui/button";
import type { DiscoverMarketplaceStats } from "@/lib/discover/queries";
import { FLYWHEEL_PATHS, registerHref } from "@/lib/onboarding/flywheel";

type DiscoverHeroProps = {
  stats: DiscoverMarketplaceStats;
  signedIn?: boolean;
};

export function DiscoverHero({ stats, signedIn = false }: DiscoverHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card px-5 py-8 shadow-sm sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,118,110,0.10),_transparent_55%)]"
      />
      <div className="relative max-w-2xl space-y-4">
        <p className="text-sm font-medium text-primary">Public proof</p>
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Public proof for AI builders.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Alvora is where shipped AI work receives named, written review.
          Reviewers judge the project. Mentors are reviewers whose judgment
          carries weight. Founding Mentors are selected to set the standard —
          a credential, not a booking link.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link
              href={
                signedIn ? FLYWHEEL_PATHS.publish : registerHref("builder")
              }
            >
              Get your work reviewed
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              href={
                signedIn ? FLYWHEEL_PATHS.reviewQueue : registerHref("reviewer")
              }
            >
              Start reviewing
            </Link>
          </Button>
        </div>
      </div>
      <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCounter value={stats.projects} label="Projects" />
        <StatCounter value={stats.mentors} label="Reviewers" />
        <StatCounter value={stats.reviews} label="Reviews" />
        <StatCounter value={stats.foundingMentors} label="Founding Mentors" />
      </dl>
    </section>
  );
}

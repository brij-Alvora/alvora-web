import Link from "next/link";

import { DiscoverMentors } from "@/components/discover/discover-mentors";
import type { DiscoverMentor } from "@/lib/discover/queries";

type DiscoverFoundingShowcaseProps = {
  mentors: DiscoverMentor[];
};

export function DiscoverFoundingShowcase({
  mentors,
}: DiscoverFoundingShowcaseProps) {
  const founding = mentors.slice(0, 12);
  if (founding.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="founding-showcase-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7344]">
            Beta Cohort 2026
          </p>
          <h2
            id="founding-showcase-heading"
            className="font-display text-2xl tracking-tight text-foreground"
          >
            Founding Mentors
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Founding Mentor is a selected credential. These mentors have
            written public reviews on Alvora — they are not a booking directory.
          </p>
        </div>
        <Link
          href="/founding-mentors"
          className="text-sm font-medium text-primary hover:underline"
        >
          Become a Founding Mentor
        </Link>
      </div>
      <DiscoverMentors mentors={founding} featured />
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/profile/queries";

export const metadata: Metadata = {
  title: "Become a Founding Mentor · Alvora",
  description:
    "An invitation to help establish the review standard builders will trust on Alvora. Beta Cohort 2026.",
};

const PRACTICES = [
  {
    title: "Review",
    body: "Read a project in your field and write what holds, what fails, and what the builder should do next.",
  },
  {
    title: "Guide",
    body: "Help a builder see which question their work is actually ready to answer.",
  },
  {
    title: "Shape",
    body: "Establish the standard later reviews will be measured against.",
  },
] as const;

const AUDIENCES = [
  {
    title: "Product Leaders",
    body: "You can tell when a product is solving a job people already have.",
  },
  {
    title: "Founders",
    body: "You know which bets are too early, and which are already late.",
  },
  {
    title: "Architects",
    body: "You can see whether a system will hold once customers depend on it.",
  },
  {
    title: "Designers",
    body: "You can see where a first-time user gets lost.",
  },
  {
    title: "AI Practitioners",
    body: "You can tell a demo from a product a stranger can use.",
  },
] as const;

function InvitationActions({ isMentor }: { isMentor: boolean }) {
  if (isMentor) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">You are in Beta Cohort 2026.</p>
        <Button asChild size="lg">
          <Link href="/profile/edit">Complete your mentor profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/login?next=/profile/edit">Accept Invitation</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login?next=/profile/edit">Join Founding Cohort</Link>
        </Button>
      </div>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Sign in with the account that received the invitation. The cohort is
        selected personally.
      </p>
    </div>
  );
}

export default async function FoundingMentorsPage() {
  const profile = await getCurrentProfile();
  const isMentor = profile?.is_founding_mentor === true;

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl space-y-20 px-4 py-16 sm:px-6 sm:py-24">
        <section className="max-w-2xl space-y-6">
          <p className="text-sm font-medium tracking-wide text-primary">
            Beta Cohort 2026
          </p>
          <div className="space-y-4">
            <h1 className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              Become an Alvora Founding Mentor
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Alvora is where builders publish work and ask for a review they
              can trust. You are invited to set that standard before the public
              arrives.
            </p>
          </div>
          <InvitationActions isMentor={isMentor} />
        </section>

        <section className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-tight">
            Why Mentors Matter
          </h2>
          <div className="space-y-4 text-base leading-7 text-foreground/90">
            <p>
              A builder does not trust a review because a platform awarded
              points. They trust it because a named expert was willing to put a
              judgment on the work.
            </p>
            <p>
              Founding Mentors are those experts. The first reviews on Alvora
              become the reference for every review that follows. Without that
              reference, public beta arrives as a pile of opinions.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl tracking-tight">
              What You&apos;ll Do
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Three kinds of judgment. All of them in writing, on work that
              matches what you know.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {PRACTICES.map((practice) => (
              <li
                key={practice.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="text-base font-semibold tracking-tight">
                  {practice.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {practice.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-2xl space-y-6">
          <div className="space-y-3">
            <h2 className="font-display text-3xl tracking-tight">
              Who We&apos;re Looking For
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              People already trusted for their judgment. The cohort is small,
              and each invitation is personal.
            </p>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {AUDIENCES.map((audience) => (
              <li key={audience.title} className="py-4">
                <p className="font-medium text-foreground">{audience.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {audience.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
          <div className="space-y-4">
            <h2 className="font-display text-3xl tracking-tight">
              Founding Mentor Recognition
            </h2>
            <FoundingMentorCredential />
          </div>
          <div className="max-w-xl space-y-4 text-base leading-7 text-foreground/90">
            <p>
              Beta Cohort 2026 is the name of this invitation. It marks the
              experts who establish Alvora&apos;s review standard during beta.
            </p>
            <p>
              The credential sits on your public profile, on Discover, and
              beside reviews you write. Builders see who selected you to set
              the standard. Your builder standing stays separate, and it comes
              from work.
            </p>
          </div>
        </section>

        <section className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-tight">
            Expected Commitment
          </h2>
          <p className="font-display text-4xl tracking-tight text-foreground">
            30–60 minutes a week
          </p>
          <p className="text-base leading-7 text-foreground/90">
            Enough for one careful review of work in your field. You choose
            what you are qualified to review, and you do it on your own time.
            The commitment is your judgment.
          </p>
        </section>

        <section className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-tight">
            Why join now
          </h2>
          <p className="text-base leading-7 text-foreground/90">
            Public beta will bring more builders than this cohort can know
            personally. The standard has to exist before they arrive. The
            people in Beta Cohort 2026 write it. Everyone who reviews after
            them inherits it.
          </p>
        </section>

        <section className="max-w-2xl space-y-4 border-t border-border pt-12">
          <h2 className="font-display text-3xl tracking-tight">
            Accept the invitation
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Join the founding cohort and help decide what a trusted review
            looks like on Alvora.
          </p>
          <InvitationActions isMentor={isMentor} />
        </section>
      </div>
    </main>
  );
}

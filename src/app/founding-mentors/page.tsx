import type { Metadata } from "next";

import { TrackAcquisitionEvent } from "@/components/analytics/track-event";
import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { InvitationActions } from "@/components/mentors/invitation-actions";
import { getCurrentProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";

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

const STEPS = [
  {
    title: "Invitation",
    body: "A personal invitation starts the conversation. It does not add the credential.",
  },
  {
    title: "Create account or sign in",
    body: "Use the account that will carry your public profile.",
  },
  {
    title: "Profile setup",
    body: "Add your expertise, mentor statement, and why you mentor.",
  },
  {
    title: "Mentor approval",
    body: "The Alvora team reviews selected members of the Beta Cohort.",
  },
  {
    title: "Founding Mentor recognition",
    body: "The credential appears on your profile only after that approval.",
  },
] as const;

export default async function FoundingMentorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getCurrentProfile();
  const isMentor = profile?.is_founding_mentor === true;
  const isSignedIn = Boolean(user);

  return (
    <main className="flex-1">
      <TrackAcquisitionEvent
        eventName="founding_mentor_page_viewed"
        mentorIntent
      />
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
          <InvitationActions isMentor={isMentor} isSignedIn={isSignedIn} />
        </section>

        <section className="max-w-2xl space-y-6">
          <h2 className="font-display text-3xl tracking-tight">
            How recognition is granted
          </h2>
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="mt-0.5 text-sm font-medium tabular-nums text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
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
              beside reviews you write after the Alvora team grants it.
              Builders see who was selected to set the standard. Your builder
              standing stays separate, and it comes from work.
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
            Continue your invitation
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Set up the profile the Alvora team will review. Recognition is
            added only after that review.
          </p>
          <InvitationActions isMentor={isMentor} isSignedIn={isSignedIn} />
        </section>
      </div>
    </main>
  );
}

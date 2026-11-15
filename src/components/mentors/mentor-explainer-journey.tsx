import { ExplainerVideo } from "@/components/media/explainer-video";
import { FlowSteps } from "@/components/media/flow-steps";

const BUILDER_FLOW = [
  "Builder",
  "Publish Project",
  "Request Review",
  "Expert Feedback",
  "Build Credibility",
] as const;

const MENTOR_PILLARS = ["Review", "Guide", "Shape"] as const;

export function MentorExplainerJourney() {
  return (
    <div className="space-y-16 sm:space-y-20">
      <section aria-labelledby="new-to-alvora-heading" className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2
            id="new-to-alvora-heading"
            className="font-display text-3xl tracking-tight"
          >
            New to Alvora?
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Start with a quick overview of the platform.
          </p>
        </div>
        <ExplainerVideo
          src="/videos/alvora-what-is.mp4"
          poster="/videos/alvora-what-is.jpg"
          title="What is Alvora?"
        />
        <FlowSteps steps={BUILDER_FLOW} />
      </section>

      <section
        aria-labelledby="why-founding-mentor-heading"
        className="space-y-6"
      >
        <div className="max-w-2xl space-y-2">
          <h2
            id="why-founding-mentor-heading"
            className="font-display text-3xl tracking-tight"
          >
            Why Become a Founding Mentor?
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Learn how experienced professionals help establish trust and review
            standards.
          </p>
        </div>
        <ExplainerVideo
          src="/videos/founding-mentor.mp4"
          poster="/videos/founding-mentor.jpg"
          title="Founding Mentor Invitation"
        />
        <div className="mx-auto w-full max-w-[900px] space-y-3">
          <ul className="flex flex-wrap justify-center gap-2">
            {MENTOR_PILLARS.map((pillar) => (
              <li
                key={pillar}
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium tracking-tight shadow-sm"
              >
                {pillar}
              </li>
            ))}
          </ul>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Founding Mentors help establish the standards, trust, and culture of
            the Alvora community.
          </p>
        </div>
      </section>
    </div>
  );
}

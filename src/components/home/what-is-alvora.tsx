import Link from "next/link";

import { ExplainerVideo } from "@/components/media/explainer-video";
import { Button } from "@/components/ui/button";

type WhatIsAlvoraProps = {
  signedIn: boolean;
};

export function WhatIsAlvora({ signedIn }: WhatIsAlvoraProps) {
  const projectsHref = signedIn ? "/discover" : "/login?next=/discover";

  return (
    <section
      aria-labelledby="what-is-alvora-heading"
      className="border-t border-border/60"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <div className="max-w-xl space-y-2">
          <h2
            id="what-is-alvora-heading"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            What is Alvora?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Builders publish projects. Alvora is where they get a written review
            they can trust.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[900px]">
          <ExplainerVideo
            src="/videos/alvora-what-is.mp4"
            poster="/videos/alvora-what-is.jpg"
            title="What is Alvora?"
          />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Builders publish projects, request validation, receive expert review,
            and build credibility through work that survives scrutiny.
          </p>
        </div>

        <div className="flex w-full max-w-[900px] flex-col gap-3 sm:mx-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={projectsHref}>Explore Projects</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/founding-mentors">Become a Founding Mentor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const TRUST_BULLETS = [
  "Publish AI Projects",
  "Request Validation",
  "Build Reputation",
];

const TRUST_POINTS = [
  {
    title: "Public identity",
    body: "Your profile is a named builder record. Projects sit on it, not in a private folder.",
  },
  {
    title: "Peer validation",
    body: "Reviews come from other builders. Reputation is not a self-score.",
  },
  {
    title: "Reputation from work",
    body: "Standing grows from published projects that have been requested, reviewed, and recorded.",
  },
];

const PROCESS_STEPS = [
  "Create Profile",
  "Publish Project",
  "Request Validation",
  "Build Reputation",
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(13,148,136,0.12),_transparent_55%),linear-gradient(180deg,#f7f8f6_0%,#eef2f0_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-64 w-[min(90%,40rem)] rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-12 sm:px-6">
          <div className="max-w-xl space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Prove the AI work you ship
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Publish projects, request validation, collect reviews, and build
              reputation as an AI builder.
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {TRUST_BULLETS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/register">Create your builder profile</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:grid-cols-3 sm:px-6">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="max-w-xs">
                <p className="text-sm font-medium tracking-tight text-foreground">
                  {point.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 sm:px-6">
            <p className="text-xs text-muted-foreground">After signup</p>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium tracking-tight text-foreground">
              {PROCESS_STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span className="font-normal text-muted-foreground" aria-hidden>
                      →
                    </span>
                  ) : null}
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(13,148,136,0.12),_transparent_55%),linear-gradient(180deg,#f7f8f6_0%,#eef2f0_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-64 w-[min(90%,40rem)] rounded-full bg-teal-500/10 blur-3xl"
      />

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col justify-center gap-8 px-4 py-16 sm:px-6">
        <p className="font-display text-5xl tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Alvora
        </p>
        <div className="max-w-xl space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            AI builder identity & validation
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Claim your profile, prove what you ship, and present a trusted
            builder identity — starting with authentication and profile
            management.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {user ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/register">Create account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";

import { ReputationCard } from "@/components/reputation/reputation-card";
import { ReputationHistory } from "@/components/reputation/reputation-history";
import { calculateReputation } from "@/lib/reputation/calculator";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reputation · Alvora",
};

export default async function ReputationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const reputation = await calculateReputation(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Reputation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Points are awarded from real activity. Your level is calculated from
          the sum of these events.
        </p>
      </div>
      <ReputationCard
        totalPoints={reputation.total_points}
        level={reputation.level}
        nextLevel={reputation.next_level}
        progress={reputation.progress}
        recentEvent={reputation.events[0] ?? null}
      />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">History</h2>
        <ReputationHistory events={reputation.events} />
      </section>
    </div>
  );
}

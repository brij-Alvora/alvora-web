import Link from "next/link";
import { redirect } from "next/navigation";

import { ContributionList } from "@/components/projects/contribution-list";
import { getMyReviewContributions } from "@/lib/projects/workspace";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Reviews given · Alvora",
};

export default async function ReviewsGivenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const contributions = await getMyReviewContributions();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/projects" className="hover:underline">
              My Projects
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Review history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Feedback you have provided to other builders.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Back to workspace</Link>
        </Button>
      </div>
      <ContributionList contributions={contributions} detailed />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { ValidationRequestList } from "@/components/validation/validation-request-list";
import { createClient } from "@/lib/supabase/server";
import {
  getMyValidationRequests,
  getReviewableValidationRequests,
  getValidationRequestsOnMyProjects,
} from "@/lib/validation/queries";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Validation Center · Alvora",
};

export default async function ValidationCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [mine, incoming, reviewable] = await Promise.all([
    getMyValidationRequests(),
    getValidationRequestsOnMyProjects(),
    getReviewableValidationRequests(),
  ]);

  const incomingOnly = incoming.filter(
    (request) => request.requested_by !== user.id,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Validation Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request product, UX, technical, idea, or AI-agent reviews.
          </p>
        </div>
        <Button asChild>
          <Link href="/validations/new">New request</Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">My requests</h2>
        <ValidationRequestList
          requests={mine}
          emptyLabel="You have not requested validation yet."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Requests on my projects
        </h2>
        <ValidationRequestList
          requests={incomingOnly}
          emptyLabel="No incoming validation requests on your projects."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Open for review
        </h2>
        <p className="text-sm text-muted-foreground">
          Open and in-review requests from other builders.
        </p>
        <ValidationRequestList
          requests={reviewable}
          emptyLabel="No open validation requests to review right now."
        />
      </section>
    </div>
  );
}

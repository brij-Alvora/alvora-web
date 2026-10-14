import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReviewForm } from "@/components/review/review-form";
import { getMyReviewForRequest } from "@/lib/review/queries";
import { createClient } from "@/lib/supabase/server";
import { getValidationRequestById } from "@/lib/validation/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Submit review · Alvora",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmitReviewPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const request = await getValidationRequestById(id);
  if (!request) notFound();

  if (request.requested_by === user.id) {
    redirect(`/validations/${id}`);
  }

  const existing = await getMyReviewForRequest(id, user.id);
  if (existing) {
    redirect(`/validations/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-sm font-medium text-primary">Review</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Evaluate {request.request_title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rate the project and leave structured feedback for the builder.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your review</CardTitle>
          <CardDescription>
            Rating is 1–5. Your review is saved against this validation request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewForm validationRequestId={request.id} />
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href={`/validations/${request.id}`}>Back to request</Link>
      </Button>
    </div>
  );
}

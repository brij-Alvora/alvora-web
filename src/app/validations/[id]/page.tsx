import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ReportButton } from "@/components/reports/report-button";
import { formatDiscoverDate } from "@/lib/discover/format";
import { ReviewList } from "@/components/review/review-list";
import { ValidatorResponse } from "@/components/validation/validator-response";
import { ValidationStatusControls } from "@/components/validation/validation-status-controls";
import { averageRating } from "@/lib/review/map-review";
import {
  getMyReviewForRequest,
  getReviewsForValidationRequest,
} from "@/lib/review/queries";
import { createClient } from "@/lib/supabase/server";
import { getValidationRequestById } from "@/lib/validation/queries";
import {
  VALIDATION_STATUS_LABELS,
  VALIDATION_TYPE_LABELS,
} from "@/lib/validations/validation-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Validation request · Alvora",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ValidationRequestDetailPage({
  params,
}: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const request = await getValidationRequestById(id);
  if (!request) notFound();

  const reviews = await getReviewsForValidationRequest(request.id);
  const mine = await getMyReviewForRequest(request.id, user.id);
  const avg = averageRating(reviews);
  const canManageStatus =
    request.requested_by === user.id ||
    request.project?.owner_id === user.id;
  const canSubmitReview = request.requested_by !== user.id && !mine;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">
          {VALIDATION_TYPE_LABELS[request.validation_type]}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {request.request_title}
        </h1>
        {request.project ? (
          <p className="text-sm text-muted-foreground">
            Project:{" "}
            {request.project.status === "published" ? (
              <Link
                href={`/project/${request.project.slug}`}
                className="font-medium text-foreground hover:underline"
              >
                {request.project.title}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {request.project.title}
              </span>
            )}
          </p>
        ) : null}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <p className="mt-1 text-sm font-medium">
              {VALIDATION_STATUS_LABELS[request.status]}
            </p>
          </div>
          {canManageStatus ? (
            <ValidationStatusControls
              requestId={request.id}
              current={request.status}
            />
          ) : null}
          {request.request_text ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
              {request.request_text}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Opened {formatDiscoverDate(request.created_at)}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
            <p className="text-sm text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              {avg != null ? ` · Average rating ${avg}/5` : ""}
            </p>
          </div>
          {canSubmitReview ? (
            <ValidatorResponse requestId={request.id} />
          ) : mine ? (
            <p className="text-sm text-muted-foreground">You already reviewed this request.</p>
          ) : null}
        </div>
        <ReviewList reviews={reviews} />
      </section>

      <ReportButton targetType="validation_request" targetId={request.id} />

      <Button asChild variant="outline">
        <Link href="/validations">Back to Validation Center</Link>
      </Button>
    </div>
  );
}

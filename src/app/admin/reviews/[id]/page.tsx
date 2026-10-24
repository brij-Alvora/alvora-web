import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFields } from "@/components/admin/admin-fields";
import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { getAdminReviewById } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Admin review · Alvora",
};

export default async function AdminReviewDetailPage({ params }: PageProps) {
  const { id } = await params;
  const review = await getAdminReviewById(id);
  if (!review) notFound();

  const reviewer = review.reviewer;
  const reviewerName = reviewer
    ? hasProfileValue(reviewer.full_name)
      ? reviewer.full_name
      : `@${reviewer.username}`
    : review.reviewer_id;

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Review
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {review.rating}/5 · {reviewerName}
            </h2>
            {reviewer?.is_founding_mentor ? (
              <div className="mt-3">
                <FoundingMentorCredential />
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {review.project?.title ?? "Project"}
            </p>
          </div>
          <AdminFields
            items={[
              { label: "Moderation", value: review.moderation_status },
              { label: "Rating", value: `${review.rating}/5` },
              {
                label: "Submitted",
                value: formatDiscoverDate(review.created_at),
              },
              { label: "Reviewer", value: reviewerName },
            ]}
          />
          <ReviewBody label="Review" value={review.review_text} />
          <ReviewBody label="What works well" value={review.what_works_well} />
          <ReviewBody label="Improvement areas" value={review.improvement_areas} />
          <ReviewBody label="Recommendations" value={review.recommendations} />
          <ReviewModerationActions
            reviewId={review.id}
            status={review.moderation_status}
          />
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`/admin/projects/${review.project_id}`}
              className="text-muted-foreground hover:underline"
            >
              Project
            </Link>
            {reviewer ? (
              <Link
                href={`/admin/users/${reviewer.id}`}
                className="text-muted-foreground hover:underline"
              >
                Reviewer
              </Link>
            ) : null}
            {review.validation_request_id ? (
              <Link
                href={`/admin/validations/${review.validation_request_id}`}
                className="text-muted-foreground hover:underline"
              >
                Validation
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Link
        href="/admin/reviews"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to reviews
      </Link>
    </section>
  );
}

function ReviewBody({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

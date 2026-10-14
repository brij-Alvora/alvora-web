import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { getAdminReviews } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin reviews · Alvora",
};

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Review moderation
        </h2>
        <p className="text-sm text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>
      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No reviews yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const reviewer = review.reviewer;
            const name = reviewer
              ? hasProfileValue(reviewer.full_name)
                ? reviewer.full_name
                : `@${reviewer.username}`
              : "Reviewer";
            return (
              <li key={review.id}>
                <Card className="shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {review.rating}/5 · {name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {review.project?.title ?? "Project"} ·{" "}
                          {formatDiscoverDate(review.created_at)}
                          {review.moderation_status !== "visible"
                            ? ` · ${review.moderation_status}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <ReviewModerationActions
                      reviewId={review.id}
                      status={review.moderation_status}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

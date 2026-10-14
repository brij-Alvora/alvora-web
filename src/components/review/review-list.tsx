import { Star } from "lucide-react";
import Link from "next/link";

import type { ReviewWithReviewer } from "@/lib/review/queries";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

type ReviewListProps = {
  reviews: ReviewWithReviewer[];
};

function reviewerLabel(review: ReviewWithReviewer) {
  const profile = review.reviewer;
  if (profile && hasProfileValue(profile.full_name)) return profile.full_name;
  if (profile?.username) return `@${profile.username}`;
  return "Reviewer";
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No reviews yet. Be the first to evaluate this request.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id}>
          <Card className="shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {review.reviewer?.username ? (
                    <Link
                      href={`/u/${review.reviewer.username}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {reviewerLabel(review)}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{reviewerLabel(review)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {review.created_at
                      ? new Date(review.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>
                <p className="inline-flex items-center gap-1 text-sm font-medium">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {review.rating}/5
                </p>
              </div>

              {review.what_works_well ? (
                <section className="space-y-1">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What works well
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {review.what_works_well}
                  </p>
                </section>
              ) : null}

              {review.improvement_areas ? (
                <section className="space-y-1">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Improvement areas
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {review.improvement_areas}
                  </p>
                </section>
              ) : null}

              {review.recommendations ? (
                <section className="space-y-1">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recommendations
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {review.recommendations}
                  </p>
                </section>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";

import { parseHeadlineParts } from "@/lib/discover/presentation";
import type { DiscoverRecentReview } from "@/lib/discover/queries";

type DiscoverRecentReviewsProps = {
  reviews: DiscoverRecentReview[];
};

export function DiscoverRecentReviews({ reviews }: DiscoverRecentReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="recent-reviews-heading">
      <div>
        <h2 id="recent-reviews-heading" className="text-lg font-semibold tracking-tight">
          Recently Reviewed
        </h2>
        <p className="text-sm text-muted-foreground">
          The latest written judgment on published work.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {reviews.map((review) => {
          const { title, company } = parseHeadlineParts(review.reviewerHeadline);
          const roleLine = [title, company].filter(Boolean).join(" · ");
          return (
            <li key={review.id}>
              <blockquote className="h-full rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <p className="text-sm leading-relaxed text-foreground">
                  “{review.excerpt}”
                </p>
                <footer className="mt-3 text-sm text-muted-foreground">
                  {review.reviewerUsername ? (
                    <Link
                      href={`/u/${review.reviewerUsername}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {review.reviewerName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{review.reviewerName}</span>
                  )}
                  {roleLine ? <span> · {roleLine}</span> : null}
                  <span>
                    {" "}
                    on{" "}
                    <Link
                      href={`/project/${review.projectSlug}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {review.projectTitle}
                    </Link>
                  </span>
                </footer>
              </blockquote>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

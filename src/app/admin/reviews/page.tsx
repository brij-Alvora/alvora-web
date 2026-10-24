import Link from "next/link";

import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { MentorAuthority } from "@/components/mentors/mentor-authority";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import {
  compareDate,
  firstParam,
  matchesQuery,
  type SearchValues,
} from "@/lib/admin/params";
import { getAdminReviews } from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin reviews · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = firstParam(params, "q");
  const sort = firstParam(params, "sort") || "newest";
  const status = firstParam(params, "status");
  const reviews = await getAdminReviews();

  const filtered = reviews
    .filter((review) => {
      const haystack = [
        review.review_text,
        review.project?.title,
        review.reviewer?.username,
        review.reviewer?.full_name,
        review.moderation_status,
        String(review.rating),
      ]
        .filter(Boolean)
        .join(" ");
      if (!matchesQuery(haystack, q)) return false;
      if (status && review.moderation_status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return compareDate(a.created_at, b.created_at);
      if (sort === "rating") return b.rating - a.rating;
      return compareDate(b.created_at, a.created_at);
    });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Review moderation
        </h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"}
          {status ? ` · ${status}` : ""}
        </p>
      </div>
      <AdminToolbar
        placeholder="Search reviewer, project, text"
        sortOptions={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "rating", label: "Rating" },
        ]}
      />
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No reviews match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((review) => {
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
                        {reviewer?.is_founding_mentor ? (
                          <div className="mt-2">
                            <MentorAuthority
                              expertise={reviewer.expertise}
                              mentorStatement={reviewer.mentor_statement}
                              credentialFirst
                            />
                          </div>
                        ) : null}
                        <p className="text-sm text-muted-foreground">
                          {review.project?.title ?? "Project"} ·{" "}
                          {formatDiscoverDate(review.created_at)}
                          {review.moderation_status !== "visible"
                            ? ` · ${review.moderation_status}`
                            : ""}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/reviews/${review.id}`}>View</Link>
                      </Button>
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

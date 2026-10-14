import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFields } from "@/components/admin/admin-fields";
import { ValidationStatusForm } from "@/components/admin/validation-status-form";
import {
  getAdminReviews,
  getAdminUsers,
  getAdminValidationById,
} from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import {
  VALIDATION_STATUS_LABELS,
  VALIDATION_TYPE_LABELS,
} from "@/lib/validations/validation-request";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Admin validation · Alvora",
};

export default async function AdminValidationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const request = await getAdminValidationById(id);
  if (!request) notFound();

  const [reviews, users] = await Promise.all([
    getAdminReviews(),
    getAdminUsers(),
  ]);
  const relatedReviews = reviews.filter(
    (review) => review.validation_request_id === request.id,
  );
  const requester = users.find(
    (row) =>
      row.profile.id === request.requested_by ||
      row.profile.user_id === request.requested_by,
  );

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Validation
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {request.request_title}
            </h2>
          </div>
          <AdminFields
            items={[
              {
                label: "Status",
                value: VALIDATION_STATUS_LABELS[request.status],
              },
              {
                label: "Type",
                value: VALIDATION_TYPE_LABELS[request.validation_type],
              },
              { label: "Project", value: request.projectTitle },
              {
                label: "Created",
                value: formatDiscoverDate(request.created_at),
              },
              {
                label: "Requester",
                value: requester
                  ? hasProfileValue(requester.profile.full_name)
                    ? requester.profile.full_name
                    : `@${requester.profile.username}`
                  : request.requested_by,
              },
            ]}
          />
          {request.request_text ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {request.request_text}
            </p>
          ) : null}
          <ValidationStatusForm requestId={request.id} current={request.status} />
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`/admin/projects/${request.project_id}`}
              className="text-muted-foreground hover:underline"
            >
              Project
            </Link>
            {requester ? (
              <Link
                href={`/admin/users/${requester.profile.id}`}
                className="text-muted-foreground hover:underline"
              >
                Requester
              </Link>
            ) : null}
            <Link
              href={`/validations/${request.id}`}
              className="text-muted-foreground hover:underline"
            >
              Public request
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-5">
          <h3 className="font-medium">Reviews</h3>
          {relatedReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            relatedReviews.map((review) => (
              <Link
                key={review.id}
                href={`/admin/reviews/${review.id}`}
                className="block text-sm hover:underline"
              >
                {review.rating}/5 · {review.moderation_status}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Link
        href="/admin/validations"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to validations
      </Link>
    </section>
  );
}

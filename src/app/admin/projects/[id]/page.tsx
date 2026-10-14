import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFields } from "@/components/admin/admin-fields";
import {
  getAdminProjectById,
  getAdminReviews,
  getAdminUsers,
  getAdminValidations,
} from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Admin project · Alvora",
};

export default async function AdminProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  if (!project) notFound();

  const [validations, reviews, users] = await Promise.all([
    getAdminValidations(),
    getAdminReviews(),
    getAdminUsers(),
  ]);
  const relatedValidations = validations.filter(
    (request) => request.project_id === project.id,
  );
  const relatedReviews = reviews.filter((review) => review.project_id === project.id);
  const owner =
    project.owner ??
    users.find(
      (row) =>
        row.profile.id === project.owner_id ||
        row.profile.user_id === project.owner_id,
    )?.profile ??
    null;
  const ownerName = owner
    ? hasProfileValue(owner.full_name)
      ? owner.full_name
      : `@${owner.username}`
    : project.owner_id;

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Project
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {project.title}
            </h2>
            <p className="text-sm text-muted-foreground">{project.slug}</p>
          </div>
          <AdminFields
            items={[
              { label: "Status", value: project.status },
              { label: "Category", value: project.category },
              { label: "Validation score", value: project.validation_score },
              {
                label: "Created",
                value: formatDiscoverDate(project.created_at),
              },
              {
                label: "Published",
                value: project.published_at
                  ? formatDiscoverDate(project.published_at)
                  : null,
              },
              { label: "Owner", value: ownerName },
              { label: "GitHub", value: project.github_url },
              { label: "Demo", value: project.demo_url },
            ]}
          />
          {project.short_description ? (
            <p className="text-sm text-muted-foreground">
              {project.short_description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-sm">
            {owner ? (
              <Link
                href={`/admin/users/${owner.id}`}
                className="text-muted-foreground hover:underline"
              >
                Owner profile
              </Link>
            ) : null}
            <Link
              href={`/project/${project.slug}`}
              className="text-muted-foreground hover:underline"
            >
              Public project
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-5">
          <h3 className="font-medium">Validations</h3>
          {relatedValidations.length === 0 ? (
            <p className="text-sm text-muted-foreground">None.</p>
          ) : (
            relatedValidations.map((request) => (
              <Link
                key={request.id}
                href={`/admin/validations/${request.id}`}
                className="block text-sm hover:underline"
              >
                {request.request_title} · {request.status}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-5">
          <h3 className="font-medium">Reviews</h3>
          {relatedReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">None.</p>
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
        href="/admin/projects"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to projects
      </Link>
    </section>
  );
}

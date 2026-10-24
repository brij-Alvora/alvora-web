import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFields } from "@/components/admin/admin-fields";
import { UserActions } from "@/components/admin/user-actions";
import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { getAdminModerationActions } from "@/lib/admin/alerts";
import {
  getAdminProjects,
  getAdminReputationEvents,
  getAdminReviews,
  getAdminUserById,
  getAdminValidations,
} from "@/lib/admin/queries";
import { formatDiscoverDate } from "@/lib/discover/format";
import {
  cityLabel,
  countryLabel,
  resolveProfileGeography,
} from "@/lib/geo/resolve";
import { hasProfileValue } from "@/lib/profile/presentation";
import {
  REPUTATION_EVENT_LABELS,
  isReputationEventType,
} from "@/lib/reputation/rules";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Admin user · Alvora",
};

function owns(ids: Set<string>, value: string | null | undefined) {
  return Boolean(value && ids.has(value));
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const row = await getAdminUserById(id);
  if (!row) notFound();

  const ids = new Set(
    [row.profile.id, row.profile.user_id].filter(
      (value): value is string => Boolean(value),
    ),
  );

  const [projects, validations, reviews, events, actions] = await Promise.all([
    getAdminProjects(),
    getAdminValidations(),
    getAdminReviews(),
    getAdminReputationEvents(),
    getAdminModerationActions("user", row.profile.id),
  ]);

  const ownedProjects = projects.filter((project) => owns(ids, project.owner_id));
  const ownedValidations = validations.filter((request) =>
    owns(ids, request.requested_by),
  );
  const ownedReviews = reviews.filter((review) => owns(ids, review.reviewer_id));
  const ownedEvents = events.filter((event) => owns(ids, event.user_id));
  const place = resolveProfileGeography(row.profile);
  const name = hasProfileValue(row.profile.full_name)
    ? row.profile.full_name
    : row.profile.username;

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {row.profile.role === "admin" ? "Admin" : "User"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h2>
            {row.profile.is_founding_mentor ? (
              <div className="mt-3">
                <FoundingMentorCredential />
              </div>
            ) : null}
            <p className="mt-1.5 text-sm text-muted-foreground">
              @{row.profile.username}
            </p>
          </div>
          <AdminFields
            items={[
              { label: "Reputation", value: `${row.points} pts · ${row.level}` },
              {
                label: "Join date",
                value: formatDiscoverDate(row.profile.created_at),
              },
              { label: "Status", value: row.profile.account_status },
              {
                label: "Founding Mentor",
                value: row.profile.is_founding_mentor ? "Yes" : "No",
              },
              {
                label: "Expertise",
                value: row.profile.expertise.join(", ") || null,
              },
              { label: "Headline", value: row.profile.headline },
              { label: "Location", value: row.profile.location },
              { label: "Country", value: countryLabel(place) },
              { label: "City", value: cityLabel(place) },
              { label: "Website", value: row.profile.website },
            ]}
          />
          <UserActions
            profileId={row.profile.id}
            username={row.profile.username}
            status={row.profile.account_status}
            isFoundingMentor={row.profile.is_founding_mentor}
            expertise={row.profile.expertise}
          />
        </CardContent>
      </Card>

      <Related
        title="Projects"
        empty="No projects."
        items={ownedProjects.map((project) => ({
          href: `/admin/projects/${project.id}`,
          title: project.title,
          meta: `${project.status} · ${project.category ?? "Uncategorized"}`,
        }))}
      />
      <Related
        title="Validations"
        empty="No validation requests."
        items={ownedValidations.map((request) => ({
          href: `/admin/validations/${request.id}`,
          title: request.request_title,
          meta: `${request.status} · ${request.projectTitle ?? "Project"}`,
        }))}
      />
      <Related
        title="Reviews"
        empty="No reviews submitted."
        items={ownedReviews.map((review) => ({
          href: `/admin/reviews/${review.id}`,
          title: `${review.rating}/5 · ${review.project?.title ?? "Project"}`,
          meta: review.moderation_status,
        }))}
      />
      <Related
        title="Reputation events"
        empty="No events."
        items={ownedEvents.map((event) => ({
          href: "/admin/events",
          title: isReputationEventType(event.event_type)
            ? REPUTATION_EVENT_LABELS[event.event_type]
            : event.event_type,
          meta: `${event.points} pts · ${formatDiscoverDate(event.created_at)}`,
        }))}
      />

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-5">
          <h3 className="font-medium">Moderation log</h3>
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {actions.map((action) => (
                <li key={String(action.id)} className="py-2">
                  <p className="font-medium">{String(action.action)}</p>
                  <p className="text-muted-foreground">
                    {action.reason ? `${String(action.reason)} · ` : ""}
                    {formatDiscoverDate(String(action.created_at))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link
        href="/admin/users"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to users
      </Link>
    </section>
  );
}

function Related({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { href: string; title: string; meta: string }[];
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-5">
        <h3 className="font-medium">{title}</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={`${item.href}-${item.title}`}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 py-2 text-sm hover:underline"
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <span className="shrink-0 text-muted-foreground">{item.meta}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

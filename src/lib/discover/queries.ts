import { getProfilesByAuthIds } from "@/lib/profile/queries";
import { mapProfile } from "@/lib/profile/map-profile";
import { createClient } from "@/lib/supabase/server";
import { hasProfileValue } from "@/lib/profile/presentation";
import {
  reviewSummaryText,
  type ProjectReviewStatus,
} from "@/lib/discover/presentation";
import { getRecommendedProjects } from "@/lib/discover/recommendations";
import {
  getProjectsByIds,
  getRecentPublishedProjects,
} from "@/lib/project/queries";
import { mapReputationEvent } from "@/lib/reputation/map-event";
import {
  REPUTATION_EVENT_LABELS,
  getReputationBand,
  isReputationEventType,
} from "@/lib/reputation/rules";
import { mapReview } from "@/lib/review/map-review";
import {
  EMPTY_MENTOR_CONTRIBUTIONS,
  getMentorContributionMap,
  type MentorContributionMetrics,
} from "@/lib/mentors/contributions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Project, ReputationEvent, Review } from "@/lib/supabase/types";
import {
  getReviewableValidationRequests,
  getValidationRequestsByIds,
  type ValidationRequestWithProject,
} from "@/lib/validation/queries";

export type DiscoverProject = Project & {
  builder: Profile | null;
};

export type DiscoverValidationRequest = ValidationRequestWithProject & {
  builder: Profile | null;
};

export type DiscoverBuilder = {
  profile: Profile;
  points: number;
  level: string;
};

export type ReviewedProjectPreview = {
  id: string;
  title: string;
  slug: string;
};

export type DiscoverMentor = {
  profile: Profile;
  points: number;
  level: string;
  reviewsGiven: number;
  contributions: MentorContributionMetrics;
  reviewedProjects: ReviewedProjectPreview[];
};

export type { ProjectReviewStatus };

export type DiscoverProjectProof = DiscoverProject & {
  reviewStatus: ProjectReviewStatus;
  reviewerName: string | null;
  reviewerUsername: string | null;
  reviewSummary: string | null;
};

export type PublicDiscoverCatalog = {
  mentors: DiscoverMentor[];
  projects: DiscoverProjectProof[];
};

export type DiscoverActivityItem = {
  id: string;
  eventType: string;
  label: string;
  detail: string;
  href: string | null;
  createdAt: string;
  actor: Profile | null;
};

export type DiscoverFeed = {
  projects: DiscoverProject[];
  recommended: DiscoverProject[];
  openRequests: DiscoverValidationRequest[];
  topBuilders: DiscoverBuilder[];
  foundingMentors: DiscoverMentor[];
  activity: DiscoverActivityItem[];
};

const ACTIVITY_TYPES = [
  "project_published",
  "validation_request_created",
  "review_submitted",
  "validation_completed",
] as const;

function builderLabel(profile: Profile | null) {
  if (!profile) return "Builder";
  if (hasProfileValue(profile.full_name)) return profile.full_name;
  return `@${profile.username}`;
}

function metadataString(
  metadata: ReputationEvent["metadata"],
  key: string,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

async function getTopBuilders(limit = 10): Promise<DiscoverBuilder[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reputation_events")
    .select("user_id, points");

  if (error || !Array.isArray(data)) return [];

  const totals = new Map<string, number>();
  for (const row of data) {
    const userId = typeof row.user_id === "string" ? row.user_id : "";
    const points =
      typeof row.points === "number" ? row.points : Number(row.points);
    if (!userId || !Number.isFinite(points)) continue;
    totals.set(userId, (totals.get(userId) ?? 0) + points);
  }

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const profiles = await getProfilesByAuthIds(ranked.map(([userId]) => userId));

  const builders: DiscoverBuilder[] = [];
  for (const [userId, points] of ranked) {
    const profile = profiles.get(userId);
    if (!profile) continue;
    builders.push({
      profile,
      points,
      level: getReputationBand(points).name,
    });
  }
  return builders;
}

function profileAuthIds(profile: Profile) {
  return [
    ...new Set(
      [profile.user_id, profile.id].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ];
}

async function getFoundingMentors(limit = 20): Promise<DiscoverMentor[]> {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("is_founding_mentor", true)
    .limit(limit);

  if (error || !Array.isArray(data)) return [];

  const profiles = data
    .map((row) => mapProfile(row as Record<string, unknown>))
    .filter((row): row is Profile => row !== null);
  if (profiles.length === 0) return [];

  const ids = [...new Set(profiles.flatMap(profileAuthIds))];
  const pointsByUser = new Map<string, number>();
  const admin = createAdminClient();
  const [contributions, events, reviewRows] = await Promise.all([
    getMentorContributionMap(profiles),
    ids.length > 0
      ? admin.from("reputation_events").select("user_id, points").in("user_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length > 0
      ? admin
          .from("reviews")
          .select("reviewer_id, project_id, created_at")
          .in("reviewer_id", ids)
          .eq("moderation_status", "visible")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const reviewedProjectIds = [
    ...new Set(
      (Array.isArray(reviewRows.data) ? reviewRows.data : [])
        .map((row) => (typeof row.project_id === "string" ? row.project_id : ""))
        .filter(Boolean),
    ),
  ];
  const publishedById = new Map<string, ReviewedProjectPreview>();
  if (reviewedProjectIds.length > 0) {
    const { data: projectRows } = await admin
      .from("projects")
      .select("id, title, slug, status")
      .in("id", reviewedProjectIds)
      .eq("status", "published");
    if (Array.isArray(projectRows)) {
      for (const row of projectRows) {
        if (
          typeof row.id === "string" &&
          typeof row.title === "string" &&
          typeof row.slug === "string"
        ) {
          publishedById.set(row.id, {
            id: row.id,
            title: row.title,
            slug: row.slug,
          });
        }
      }
    }
  }

  const reviewedByMentor = new Map<string, ReviewedProjectPreview[]>();
  if (Array.isArray(reviewRows.data)) {
    for (const profile of profiles) {
      const keys = new Set(profileAuthIds(profile));
      const seen = new Set<string>();
      const list: ReviewedProjectPreview[] = [];
      for (const row of reviewRows.data) {
        const reviewerId =
          typeof row.reviewer_id === "string" ? row.reviewer_id : "";
        const projectId =
          typeof row.project_id === "string" ? row.project_id : "";
        if (!keys.has(reviewerId) || seen.has(projectId)) continue;
        const project = publishedById.get(projectId);
        if (!project) continue;
        seen.add(projectId);
        list.push(project);
        if (list.length >= 4) break;
      }
      reviewedByMentor.set(profile.id, list);
    }
  }

  if (Array.isArray(events.data)) {
    for (const row of events.data) {
      const userId = typeof row.user_id === "string" ? row.user_id : "";
      const points =
        typeof row.points === "number" ? row.points : Number(row.points);
      if (!userId || !Number.isFinite(points)) continue;
      pointsByUser.set(userId, (pointsByUser.get(userId) ?? 0) + points);
    }
  }

  return profiles
    .map((profile) => {
      const keys = profileAuthIds(profile);
      const points = keys.reduce(
        (total, id) => total + (pointsByUser.get(id) ?? 0),
        0,
      );
      const mentorContributions =
        contributions.get(profile.id) ?? EMPTY_MENTOR_CONTRIBUTIONS;
      const authority =
        (hasProfileValue(profile.mentor_statement) ? 2 : 0) +
        (profile.expertise.length > 0 ? 1 : 0);
      return {
        profile,
        points,
        level: getReputationBand(points).name,
        reviewsGiven: mentorContributions.reviewsContributed,
        contributions: mentorContributions,
        reviewedProjects: reviewedByMentor.get(profile.id) ?? [],
        authority,
      };
    })
    .sort(
      (a, b) =>
        b.authority - a.authority ||
        b.contributions.reviewsContributed - a.contributions.reviewsContributed ||
        builderLabel(a.profile).localeCompare(builderLabel(b.profile)),
    )
    .slice(0, limit)
    .map(({ authority: _authority, ...mentor }) => mentor);
}

async function getRecentActivity(limit = 12): Promise<DiscoverActivityItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reputation_events")
    .select("*")
    .in("event_type", [...ACTIVITY_TYPES])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) return [];

  const events = data
    .map((row) => mapReputationEvent(row as Record<string, unknown>))
    .filter((row): row is ReputationEvent => row !== null)
    .filter((row) =>
      ACTIVITY_TYPES.includes(row.event_type as (typeof ACTIVITY_TYPES)[number]),
    );

  const projectIds = events
    .map((event) => metadataString(event.metadata, "project_id") ?? "")
    .filter(Boolean);
  const requestIds = events.flatMap((event) => {
    const fromMeta = metadataString(event.metadata, "validation_id");
    if (fromMeta) return [fromMeta];
    if (
      event.event_type === "validation_request_created" ||
      event.event_type === "validation_completed"
    ) {
      return event.source_id ? [event.source_id] : [];
    }
    return [];
  });
  const actorIds = events.map((event) => event.user_id);

  const [projects, requests, profiles] = await Promise.all([
    getProjectsByIds(projectIds),
    getValidationRequestsByIds(requestIds),
    getProfilesByAuthIds(actorIds),
  ]);

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const requestsById = new Map(requests.map((request) => [request.id, request]));

  return events.map((event) => {
    const actor = profiles.get(event.user_id) ?? null;
    const projectId = metadataString(event.metadata, "project_id");
    const validationId =
      metadataString(event.metadata, "validation_id") ??
      (event.event_type.includes("validation") ? event.source_id : null);
    const project = projectId ? projectsById.get(projectId) ?? null : null;
    const request = validationId
      ? requestsById.get(validationId) ?? null
      : null;
    const label = isReputationEventType(event.event_type)
      ? REPUTATION_EVENT_LABELS[event.event_type]
      : event.event_type;

    let detail = builderLabel(actor);
    let href: string | null = actor?.username ? `/u/${actor.username}` : null;

    if (event.event_type === "project_published" && project) {
      detail = project.title;
      href = `/project/${project.slug}`;
    } else if (request) {
      detail = request.request_title;
      href = `/validations/${request.id}`;
    } else if (project) {
      detail = project.title;
      href = project.status === "published" ? `/project/${project.slug}` : href;
    }

    return {
      id: event.id,
      eventType: event.event_type,
      label,
      detail,
      href,
      createdAt: event.created_at,
      actor,
    };
  });
}

async function getPublicProfilesByAuthIds(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const byAuthId = new Map<string, Profile>();
  if (ids.length === 0) return byAuthId;

  const admin = createAdminClient();
  const [{ data: byUserId }, { data: byId }] = await Promise.all([
    admin.from("profiles").select("*").in("user_id", ids),
    admin.from("profiles").select("*").in("id", ids),
  ]);

  for (const row of [...(byUserId ?? []), ...(byId ?? [])]) {
    const profile = mapProfile(row as Record<string, unknown>);
    if (!profile) continue;
    if (profile.user_id) byAuthId.set(profile.user_id, profile);
    byAuthId.set(profile.id, profile);
  }
  return byAuthId;
}

async function getPublishedProjectProofs(
  limit = 24,
): Promise<DiscoverProjectProof[]> {
  const projects = await getRecentPublishedProjects(limit);
  if (projects.length === 0) return [];

  const admin = createAdminClient();
  const ids = projects.map((project) => project.id);
  const [reviewResult, requestResult] = await Promise.all([
    admin
      .from("reviews")
      .select("*")
      .in("project_id", ids)
      .eq("moderation_status", "visible")
      .order("created_at", { ascending: false }),
    admin
      .from("validation_requests")
      .select("project_id, status")
      .in("project_id", ids),
  ]);

  const reviews = (Array.isArray(reviewResult.data) ? reviewResult.data : [])
    .map((row) => mapReview(row as Record<string, unknown>))
    .filter((row): row is Review => row !== null);

  const latestReviewByProject = new Map<string, Review>();
  for (const review of reviews) {
    if (!latestReviewByProject.has(review.project_id)) {
      latestReviewByProject.set(review.project_id, review);
    }
  }

  const requestStatusByProject = new Map<string, Set<string>>();
  if (Array.isArray(requestResult.data)) {
    for (const row of requestResult.data) {
      const projectId = typeof row.project_id === "string" ? row.project_id : "";
      const status = typeof row.status === "string" ? row.status : "";
      if (!projectId || !status) continue;
      const set = requestStatusByProject.get(projectId) ?? new Set<string>();
      set.add(status);
      requestStatusByProject.set(projectId, set);
    }
  }

  const reviewerIds = [
    ...new Set(
      [...latestReviewByProject.values()].map((review) => review.reviewer_id),
    ),
  ];
  const profiles = await getPublicProfilesByAuthIds([
    ...projects.map((project) => project.owner_id),
    ...reviewerIds,
  ]);

  return projects.map((project) => {
    const latest = latestReviewByProject.get(project.id) ?? null;
    const statuses = requestStatusByProject.get(project.id);
    let reviewStatus: ProjectReviewStatus = "awaiting_review";
    if (latest) reviewStatus = "reviewed";
    else if (statuses?.has("in_review")) reviewStatus = "in_review";
    else if (statuses?.has("open")) reviewStatus = "awaiting_review";

    const reviewer = latest
      ? profiles.get(latest.reviewer_id) ?? null
      : null;

    return {
      ...project,
      builder: profiles.get(project.owner_id) ?? null,
      reviewStatus,
      reviewerName: reviewer ? builderLabel(reviewer) : null,
      reviewerUsername: reviewer?.username ?? null,
      reviewSummary: latest ? reviewSummaryText(latest) : null,
    };
  });
}

export async function getPublicDiscoverCatalog(): Promise<PublicDiscoverCatalog> {
  const [mentors, projects] = await Promise.all([
    getFoundingMentors(20),
    getPublishedProjectProofs(24),
  ]);
  return { mentors, projects };
}

export async function getDiscoverFeed(userId: string): Promise<DiscoverFeed> {
  const [projects, recommended, reviewable, topBuilders, foundingMentors, activity] =
    await Promise.all([
      getRecentPublishedProjects(8),
      getRecommendedProjects({ userId, limit: 6 }),
      getReviewableValidationRequests(),
      getTopBuilders(10),
      getFoundingMentors(20),
      getRecentActivity(12),
    ]);
  const openRequests = reviewable.slice(0, 8);

  const builderIds = [
    ...projects.map((project) => project.owner_id),
    ...recommended.map((project) => project.owner_id),
    ...openRequests.map((request) => request.requested_by),
  ];
  const profiles = await getProfilesByAuthIds(builderIds);

  const withBuilder = (project: Project): DiscoverProject => ({
    ...project,
    builder: profiles.get(project.owner_id) ?? null,
  });

  return {
    projects: projects.map(withBuilder),
    recommended: recommended.map(withBuilder),
    openRequests: openRequests.map((request) => ({
      ...request,
      builder: profiles.get(request.requested_by) ?? null,
    })),
    topBuilders,
    foundingMentors,
    activity,
  };
}

export { builderLabel };

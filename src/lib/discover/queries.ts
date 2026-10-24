import { getProfilesByAuthIds } from "@/lib/profile/queries";
import { mapProfile } from "@/lib/profile/map-profile";
import { createClient } from "@/lib/supabase/server";
import { hasProfileValue } from "@/lib/profile/presentation";
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
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Project, ReputationEvent } from "@/lib/supabase/types";
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

export type DiscoverMentor = {
  profile: Profile;
  points: number;
  level: string;
  reviewsGiven: number;
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
  const supabase = await createClient();
  const { data, error } = await supabase
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
  const reviewsByUser = new Map<string, number>();

  const admin = createAdminClient();
  if (ids.length > 0) {
    const { data: events } = await admin
      .from("reputation_events")
      .select("user_id, points")
      .in("user_id", ids);
    if (Array.isArray(events)) {
      for (const row of events) {
        const userId = typeof row.user_id === "string" ? row.user_id : "";
        const points =
          typeof row.points === "number" ? row.points : Number(row.points);
        if (!userId || !Number.isFinite(points)) continue;
        pointsByUser.set(userId, (pointsByUser.get(userId) ?? 0) + points);
      }
    }
  }

  if (ids.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("reviewer_id")
      .in("reviewer_id", ids)
      .eq("moderation_status", "visible");
    if (Array.isArray(reviews)) {
      for (const row of reviews) {
        const reviewerId =
          typeof row.reviewer_id === "string" ? row.reviewer_id : "";
        if (!reviewerId) continue;
        reviewsByUser.set(reviewerId, (reviewsByUser.get(reviewerId) ?? 0) + 1);
      }
    }
  }

  return profiles
    .map((profile) => {
      const keys = profileAuthIds(profile);
      const points = keys.reduce(
        (total, id) => total + (pointsByUser.get(id) ?? 0),
        0,
      );
      const reviewsGiven = keys.reduce(
        (total, id) => total + (reviewsByUser.get(id) ?? 0),
        0,
      );
      return {
        profile,
        points,
        level: getReputationBand(points).name,
        reviewsGiven,
      };
    })
    .sort((a, b) => b.points - a.points || builderLabel(a.profile).localeCompare(builderLabel(b.profile)))
    .slice(0, limit);
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

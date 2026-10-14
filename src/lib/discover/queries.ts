import { getProfilesByAuthIds } from "@/lib/profile/queries";
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
  getOpenValidationRequests,
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
  const [projects, recommended, openRequests, topBuilders, activity] =
    await Promise.all([
      getRecentPublishedProjects(8),
      getRecommendedProjects({ userId, limit: 6 }),
      getOpenValidationRequests(8),
      getTopBuilders(10),
      getRecentActivity(12),
    ]);

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
    activity,
  };
}

export { builderLabel };

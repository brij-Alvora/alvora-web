import { mapProfile } from "@/lib/profile/map-profile";
import { getProfilesByAuthIds } from "@/lib/profile/queries";
import { mapProject } from "@/lib/project/map-project";
import { getReputationBand } from "@/lib/reputation/rules";
import { mapReview } from "@/lib/review/map-review";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Profile,
  Project,
  Review,
  ValidationRequest,
} from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";

export type AdminCounts = {
  users: number;
  projects: number;
  validationRequests: number;
  reviews: number;
  reputationEvents: number;
};

export type AdminAnalytics = AdminCounts & {
  projectsByStatus: Record<string, number>;
  validationsByStatus: Record<string, number>;
  reviewsByRating: Record<string, number>;
  usersByStatus: Record<string, number>;
};

export type AdminUserRow = {
  profile: Profile;
  points: number;
  level: string;
};

export type AdminReviewRow = Review & {
  reviewer: Profile | null;
  project: Pick<Project, "id" | "title" | "slug"> | null;
};

async function countRows(table: "profiles" | "projects" | "validation_requests" | "reviews" | "reputation_events") {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error || count == null) return 0;
  return count;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const [users, projects, validationRequests, reviews, reputationEvents] =
    await Promise.all([
      countRows("profiles"),
      countRows("projects"),
      countRows("validation_requests"),
      countRows("reviews"),
      countRows("reputation_events"),
    ]);
  return { users, projects, validationRequests, reviews, reputationEvents };
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const admin = createAdminClient();
  const [counts, profiles, projects, requests, reviews] = await Promise.all([
    getAdminCounts(),
    admin.from("profiles").select("account_status"),
    admin.from("projects").select("status"),
    admin.from("validation_requests").select("status"),
    admin.from("reviews").select("rating"),
  ]);

  const usersByStatus: Record<string, number> = {};
  for (const row of profiles.data ?? []) {
    increment(usersByStatus, String(row.account_status ?? "active"));
  }

  const projectsByStatus: Record<string, number> = {};
  for (const row of projects.data ?? []) {
    increment(projectsByStatus, String(row.status ?? "unknown"));
  }

  const validationsByStatus: Record<string, number> = {};
  for (const row of requests.data ?? []) {
    increment(validationsByStatus, String(row.status ?? "unknown"));
  }

  const reviewsByRating: Record<string, number> = {};
  for (const row of reviews.data ?? []) {
    increment(reviewsByRating, String(row.rating ?? "unrated"));
  }

  return {
    ...counts,
    projectsByStatus,
    validationsByStatus,
    reviewsByRating,
    usersByStatus,
  };
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const [{ data: profileRows }, { data: eventRows }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("reputation_events").select("user_id, points"),
  ]);

  const totals = new Map<string, number>();
  for (const row of eventRows ?? []) {
    const userId = typeof row.user_id === "string" ? row.user_id : "";
    const points = typeof row.points === "number" ? row.points : Number(row.points);
    if (!userId || !Number.isFinite(points)) continue;
    totals.set(userId, (totals.get(userId) ?? 0) + points);
  }

  return (profileRows ?? [])
    .map((row) => mapProfile(row as Record<string, unknown>))
    .filter((row): row is Profile => row !== null)
    .map((profile) => {
      const key = profile.user_id ?? profile.id;
      const points = totals.get(key) ?? totals.get(profile.id) ?? 0;
      return {
        profile,
        points,
        level: getReputationBand(points).name,
      };
    });
}

export async function getAdminUserById(id: string): Promise<AdminUserRow | null> {
  const users = await getAdminUsers();
  return (
    users.find(
      (row) => row.profile.id === id || row.profile.user_id === id,
    ) ?? null
  );
}

export async function getAdminValidations(): Promise<
  (ValidationRequest & { projectTitle: string | null })[]
> {
  const admin = createAdminClient();
  const [{ data: requestRows }, { data: projectRows }] = await Promise.all([
    admin
      .from("validation_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    admin.from("projects").select("id, title"),
  ]);

  const titles = new Map<string, string>();
  for (const row of projectRows ?? []) {
    if (typeof row.id === "string" && typeof row.title === "string") {
      titles.set(row.id, row.title);
    }
  }

  return (requestRows ?? [])
    .map((row) => mapValidationRequest(row as Record<string, unknown>))
    .filter((row): row is ValidationRequest => row !== null)
    .map((request) => ({
      ...request,
      projectTitle: titles.get(request.project_id) ?? null,
    }));
}

export async function getAdminReviews(): Promise<AdminReviewRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const reviews = data
    .map((row) => mapReview(row as Record<string, unknown>))
    .filter((row): row is Review => row !== null);

  const projectIds = [...new Set(reviews.map((review) => review.project_id))];
  const reviewerIds = [...new Set(reviews.map((review) => review.reviewer_id))];

  const [{ data: projectRows }, profiles] = await Promise.all([
    projectIds.length
      ? admin.from("projects").select("id, title, slug").in("id", projectIds)
      : Promise.resolve({ data: [] }),
    getProfilesByAuthIds(reviewerIds),
  ]);

  const projects = new Map<string, Pick<Project, "id" | "title" | "slug">>();
  for (const row of projectRows ?? []) {
    const project = mapProject(row as Record<string, unknown>);
    if (project) {
      projects.set(project.id, {
        id: project.id,
        title: project.title,
        slug: project.slug,
      });
    }
  }

  return reviews.map((review) => ({
    ...review,
    reviewer: profiles.get(review.reviewer_id) ?? null,
    project: projects.get(review.project_id) ?? null,
  }));
}

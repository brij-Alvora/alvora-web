import { mapProject } from "@/lib/project/map-project";
import {
  buildProjectPerformance,
  splitReputationSources,
  type ProjectPerformance,
  type ReviewContribution,
  type WorkspaceFeedItem,
} from "@/lib/projects/performance";
import { getMyProjects, getProjectsByIds } from "@/lib/project/queries";
import { calculateReputation } from "@/lib/reputation/calculator";
import { mapReview } from "@/lib/review/map-review";
import { createClient } from "@/lib/supabase/server";
import type { Review, ValidationRequest } from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";

export type WorkspaceDashboard = {
  performances: ProjectPerformance[];
  feed: WorkspaceFeedItem[];
  contributions: ReviewContribution[];
  totals: {
    reputationPoints: number;
    reputationLevel: string;
    reputationFromProjects: number;
    reputationFromReviews: number;
    averageScore: number | null;
    reviewsReceived: number;
    completedValidations: number;
    reviewsGiven: number;
    needingAttention: number;
  };
};

function mapReviews(data: unknown): Review[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapReview(row as Record<string, unknown>))
    .filter((row): row is Review => row !== null);
}

function mapRequests(data: unknown): ValidationRequest[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapValidationRequest(row as Record<string, unknown>))
    .filter((row): row is ValidationRequest => row !== null);
}

export async function getProjectInsights(
  projectId: string,
): Promise<ProjectPerformance | null> {
  const dashboard = await getWorkspaceDashboard();
  return (
    dashboard.performances.find((item) => item.project.id === projectId) ?? null
  );
}

export async function getPublicProjectInsights(
  projectId: string,
): Promise<ProjectPerformance | null> {
  const supabase = await createClient();
  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (!projectRow) return null;

  const ownerId =
    typeof projectRow.owner_id === "string" ? projectRow.owner_id : "";
  const [{ data: reviewRows }, { data: requestRows }, reputation] =
    await Promise.all([
      supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .eq("moderation_status", "visible")
        .order("created_at", { ascending: false }),
      supabase
        .from("validation_requests")
        .select("*")
        .eq("project_id", projectId),
      ownerId
        ? calculateReputation(ownerId)
        : Promise.resolve({ events: [] }),
    ]);

  const project = mapProject(projectRow as Record<string, unknown>);
  if (!project) return null;

  return buildProjectPerformance({
    project,
    reviews: mapReviews(reviewRows),
    requests: mapRequests(requestRows),
    reputationEvents: reputation.events,
  });
}

export async function getWorkspaceDashboard(): Promise<WorkspaceDashboard> {
  const empty: WorkspaceDashboard = {
    performances: [],
    feed: [],
    contributions: [],
    totals: {
      reputationPoints: 0,
      reputationLevel: "Builder",
      reputationFromProjects: 0,
      reputationFromReviews: 0,
      averageScore: null,
      reviewsReceived: 0,
      completedValidations: 0,
      reviewsGiven: 0,
      needingAttention: 0,
    },
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const projects = await getMyProjects();
  const ids = projects.map((project) => project.id);

  const [
    { data: requestRows },
    { data: reviewRows },
    { data: givenRows, count: givenCount },
    reputation,
  ] = await Promise.all([
    ids.length
      ? supabase
          .from("validation_requests")
          .select("*")
          .in("project_id", ids)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("reviews")
          .select("*")
          .in("project_id", ids)
          .neq("moderation_status", "hidden")
          .neq("moderation_status", "flagged")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("reviewer_id", user.id)
      .neq("moderation_status", "hidden")
      .order("created_at", { ascending: false })
      .limit(40),
    calculateReputation(user.id),
  ]);

  const requests = mapRequests(requestRows);
  const reviews = mapReviews(reviewRows);
  const given = mapReviews(givenRows);
  const givenProjects = await getProjectsByIds(
    given.map((review) => review.project_id),
  );

  const performances = projects.map((project) =>
    buildProjectPerformance({
      project,
      reviews: reviews.filter((review) => review.project_id === project.id),
      requests: requests.filter((request) => request.project_id === project.id),
      reputationEvents: reputation.events,
    }),
  );

  const projectTitle = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.title ?? "a project";

  const feed: WorkspaceFeedItem[] = [
    ...reviews.slice(0, 8).map((review) => ({
      id: `review:${review.id}`,
      kind: "review" as const,
      title: `${review.rating}★ on ${projectTitle(review.project_id)}`,
      detail:
        review.what_works_well?.replace(/\s+/g, " ").trim().slice(0, 110) ||
        "New review received.",
      href: `/projects/${review.project_id}/feedback`,
      createdAt: review.created_at,
    })),
    ...requests
      .filter((request) => request.status === "completed")
      .slice(0, 6)
      .map((request) => ({
        id: `validation:${request.id}`,
        kind: "validation" as const,
        title: "Validation completed",
        detail: request.request_title,
        href: `/validations/${request.id}`,
        createdAt: request.created_at,
      })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const contributions = mapContributions(given, givenProjects);

  const scored = performances
    .map((item) => item.ratingAverage)
    .filter((value): value is number => value != null);
  const averageScore =
    scored.length === 0
      ? null
      : Math.round(
          (scored.reduce((sum, value) => sum + value, 0) / scored.length) * 10,
        ) / 10;
  const reputationSources = splitReputationSources(reputation.events);

  return {
    performances,
    feed,
    contributions,
    totals: {
      reputationPoints: reputation.total_points,
      reputationLevel: reputation.level,
      reputationFromProjects: reputationSources.fromProjects,
      reputationFromReviews: reputationSources.fromReviews,
      averageScore,
      reviewsReceived: performances.reduce(
        (sum, item) => sum + item.reviewCount,
        0,
      ),
      completedValidations: performances.reduce(
        (sum, item) => sum + item.completedCount,
        0,
      ),
      reviewsGiven: givenCount ?? given.length,
      needingAttention: performances.filter(
        (item) => item.health === "needs_attention",
      ).length,
    },
  };
}

function mapContributions(
  given: Review[],
  givenProjects: Awaited<ReturnType<typeof getProjectsByIds>>,
): ReviewContribution[] {
  return given.map((review) => {
    const project = givenProjects.find((item) => item.id === review.project_id);
    return {
      id: review.id,
      rating: review.rating,
      projectTitle: project?.title ?? "Project",
      projectHref:
        project?.status === "published" ? `/project/${project.slug}` : null,
      validationHref: review.validation_request_id
        ? `/validations/${review.validation_request_id}`
        : null,
      createdAt: review.created_at,
      strength: review.what_works_well,
      improvement: review.improvement_areas,
      recommendation: review.recommendations,
    };
  });
}

export async function getMyReviewContributions(): Promise<ReviewContribution[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: givenRows } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewer_id", user.id)
    .neq("moderation_status", "hidden")
    .order("created_at", { ascending: false })
    .limit(80);

  const given = mapReviews(givenRows);
  const givenProjects = await getProjectsByIds(
    given.map((review) => review.project_id),
  );
  return mapContributions(given, givenProjects);
}

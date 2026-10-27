import {
  UNSPECIFIED,
  cityLabel,
  countryLabel,
  regionLabel,
  resolveProfileGeography,
} from "@/lib/geo/resolve";
import { mapProfile } from "@/lib/profile/map-profile";
import { getProfileCompletion } from "@/lib/profile/presentation";
import { getProfilesByAuthIds } from "@/lib/profile/queries";
import { mapProject } from "@/lib/project/map-project";
import {
  REPUTATION_LEVELS,
  getReputationBand,
} from "@/lib/reputation/rules";
import { mapReputationEvent } from "@/lib/reputation/map-event";
import { mapReport } from "@/lib/reports/map-report";
import { mapReview } from "@/lib/review/map-review";
import { mapSupportTicket } from "@/lib/support/map-ticket";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Profile,
  Project,
  Report,
  ReputationEvent,
  Review,
  SupportTicket,
  ValidationRequest,
} from "@/lib/supabase/types";
import { buildFunnelSteps, type FunnelStep } from "@/lib/analytics/funnel";
import { mapValidationRequest } from "@/lib/validation/map-request";

export type { FunnelStep };

export type AdminCounts = {
  users: number;
  projects: number;
  validationRequests: number;
  reviews: number;
  reputationEvents: number;
};

export type RankedCount = {
  label: string;
  value: number;
};

export type GrowthMetric = {
  label: string;
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number | null;
};

export type AdminAnalytics = AdminCounts & {
  projectsByStatus: Record<string, number>;
  validationsByStatus: Record<string, number>;
  reviewsByRating: Record<string, number>;
  usersByStatus: Record<string, number>;
  usersByCountry: RankedCount[];
  usersByCity: RankedCount[];
  topCountries: RankedCount[];
  topCities: RankedCount[];
  topRegions: RankedCount[];
  projectsByCategory: RankedCount[];
  topBuilders: AdminUserRow[];
  levels: RankedCount[];
  weeklyGrowth: GrowthMetric[];
  monthlyGrowth: GrowthMetric[];
  funnel: FunnelStep[];
  validationAnalytics: {
    open: number;
    inReview: number;
    completed: number;
    averageCompletionHours: number | null;
    sampleSize: number;
  };
  platformHealth: {
    profileCompletionPercent: number;
    projectsWithValidationPercent: number;
    validationCompletionPercent: number;
    averageReviewsPerValidation: number;
  };
  mostActiveReviewers: RankedCount[];
  mostValidatedProjects: RankedCount[];
  geography: {
    countries: number;
    cities: number;
    regions: number;
    withLocation: number;
    unspecified: number;
  };
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

export type AdminProjectRow = Project & {
  owner: Profile | null;
};

export type AdminValidationRow = ValidationRequest & {
  projectTitle: string | null;
  projectSlug: string | null;
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

function toRanked(map: Record<string, number>, exclude: string[] = []): RankedCount[] {
  return Object.entries(map)
    .filter(([label]) => !exclude.includes(label))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));
}

function asDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countInRange(
  dates: Array<Date | null>,
  start: Date,
  end: Date,
) {
  return dates.filter((date) => date && date >= start && date < end).length;
}

function growthMetric(
  label: string,
  dates: Array<Date | null>,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
): GrowthMetric {
  const current = countInRange(dates, currentStart, currentEnd);
  const previous = countInRange(dates, previousStart, currentStart);
  const delta = current - previous;
  const deltaPercent =
    previous === 0 ? (current === 0 ? 0 : null) : Math.round((delta / previous) * 100);
  return { label, current, previous, delta, deltaPercent };
}

async function countAuthUsers() {
  try {
    const admin = createAdminClient();
    let page = 1;
    let total = 0;
    while (page <= 20) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) break;
      const users = data.users ?? [];
      total += users.length;
      if (users.length < 200) break;
      page += 1;
    }
    return total;
  } catch {
    return 0;
  }
}


export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const admin = createAdminClient();
  const [
    counts,
    users,
    signups,
    profileRows,
    projectRows,
    requestRows,
    reviewRows,
    completionEvents,
  ] = await Promise.all([
    getAdminCounts(),
    getAdminUsers(),
    countAuthUsers(),
    admin.from("profiles").select("*"),
    admin
      .from("projects")
      .select("id, title, slug, status, category, owner_id, created_at"),
    admin
      .from("validation_requests")
      .select("id, status, requested_by, created_at, project_id"),
    admin
      .from("reviews")
      .select("rating, reviewer_id, created_at, project_id, validation_request_id"),
    admin
      .from("reputation_events")
      .select("source_id, created_at")
      .eq("event_type", "validation_completed"),
  ]);

  const usersByStatus: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  const regionCounts: Record<string, number> = {};
  const profileCreated: Array<Date | null> = [];
  let withLocation = 0;

  for (const raw of profileRows.data ?? []) {
    const profile = mapProfile(raw as Record<string, unknown>);
    increment(usersByStatus, profile?.account_status ?? "active");
    profileCreated.push(asDate(raw.created_at));
    const geo = resolveProfileGeography({
      location: profile?.location ?? asOptionalString(raw.location),
      city: profile?.city ?? asOptionalString(raw.city),
      country: profile?.country ?? asOptionalString(raw.country),
    });
    increment(countryCounts, countryLabel(geo));
    increment(cityCounts, cityLabel(geo));
    increment(regionCounts, regionLabel(geo));
    if (geo.city || geo.country || geo.region) withLocation += 1;
  }

  const projectsByStatus: Record<string, number> = {};
  const projectsByCategoryMap: Record<string, number> = {};
  const projectOwners = new Set<string>();
  const projectCreated: Array<Date | null> = [];
  const projectTitles = new Map<string, string>();
  for (const row of projectRows.data ?? []) {
    increment(projectsByStatus, String(row.status ?? "unknown"));
    const category =
      typeof row.category === "string" && row.category.trim()
        ? row.category.trim()
        : "Uncategorized";
    increment(projectsByCategoryMap, category);
    if (typeof row.owner_id === "string") projectOwners.add(row.owner_id);
    projectCreated.push(asDate(row.created_at));
    if (typeof row.id === "string") {
      projectTitles.set(
        row.id,
        typeof row.title === "string" && row.title.trim()
          ? row.title.trim()
          : row.id,
      );
    }
  }

  const validationsByStatus: Record<string, number> = {};
  const validators = new Set<string>();
  const requestCreated: Array<Date | null> = [];
  const requestCreatedById = new Map<string, Date>();
  const validationsByProject: Record<string, number> = {};
  const projectsWithValidation = new Set<string>();
  for (const row of requestRows.data ?? []) {
    const status = String(row.status ?? "unknown");
    increment(validationsByStatus, status);
    if (typeof row.requested_by === "string") validators.add(row.requested_by);
    const created = asDate(row.created_at);
    requestCreated.push(created);
    if (typeof row.id === "string" && created) {
      requestCreatedById.set(row.id, created);
    }
    if (typeof row.project_id === "string") {
      increment(validationsByProject, row.project_id);
      projectsWithValidation.add(row.project_id);
    }
  }

  const reviewsByRating: Record<string, number> = {};
  const reviewers = new Set<string>();
  const reviewCreated: Array<Date | null> = [];
  const reviewsByReviewer: Record<string, number> = {};
  let reviewsOnRequests = 0;
  for (const row of reviewRows.data ?? []) {
    increment(reviewsByRating, String(row.rating ?? "unrated"));
    if (typeof row.reviewer_id === "string") {
      reviewers.add(row.reviewer_id);
      increment(reviewsByReviewer, row.reviewer_id);
    }
    reviewCreated.push(asDate(row.created_at));
    if (typeof row.validation_request_id === "string" && row.validation_request_id) {
      reviewsOnRequests += 1;
    }
  }

  const profilePercents = (profileRows.data ?? [])
    .map((raw) => mapProfile(raw as Record<string, unknown>))
    .filter((row) => row !== null)
    .map((profile) => getProfileCompletion(profile).percent);
  const profileCompletionPercent =
    profilePercents.length === 0
      ? 0
      : Math.round(
          profilePercents.reduce((sum, value) => sum + value, 0) /
            profilePercents.length,
        );
  const projectCount = (projectRows.data ?? []).length;
  const requestCount = (requestRows.data ?? []).length;
  const completedCount = validationsByStatus.completed ?? 0;

  const completionMs: number[] = [];
  for (const row of completionEvents.data ?? []) {
    const sourceId = typeof row.source_id === "string" ? row.source_id : "";
    const completedAt = asDate(row.created_at);
    const startedAt = requestCreatedById.get(sourceId);
    if (!sourceId || !completedAt || !startedAt) continue;
    const delta = completedAt.getTime() - startedAt.getTime();
    if (delta >= 0) completionMs.push(delta);
  }

  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const weekStart = new Date(now.getTime() - weekMs);
  const prevWeekStart = new Date(now.getTime() - 2 * weekMs);
  const monthStart = new Date(now.getTime() - monthMs);
  const prevMonthStart = new Date(now.getTime() - 2 * monthMs);

  const growthSeries = [
    { label: "Users", dates: profileCreated },
    { label: "Projects", dates: projectCreated },
    { label: "Validations", dates: requestCreated },
    { label: "Reviews", dates: reviewCreated },
  ];

  const levelsMap: Record<string, number> = {};
  for (const level of REPUTATION_LEVELS) levelsMap[level.name] = 0;
  for (const row of users) {
    increment(levelsMap, row.level);
  }

  const usersByCountry = toRanked(countryCounts);
  const usersByCity = toRanked(cityCounts);
  const usersByRegion = toRanked(regionCounts);
  const signupCount = signups > 0 ? signups : (profileRows.data ?? []).length;

  const averageCompletionHours =
    completionMs.length === 0
      ? null
      : Math.round(
          (completionMs.reduce((sum, value) => sum + value, 0) /
            completionMs.length /
            36e5) *
            10,
        ) / 10;

  return {
    ...counts,
    projectsByStatus,
    validationsByStatus,
    reviewsByRating,
    usersByStatus,
    usersByCountry,
    usersByCity,
    topCountries: toRanked(countryCounts, [UNSPECIFIED]).slice(0, 5),
    topCities: toRanked(cityCounts, [UNSPECIFIED]).slice(0, 5),
    topRegions: toRanked(regionCounts, [UNSPECIFIED]).slice(0, 5),
    projectsByCategory: toRanked(projectsByCategoryMap),
    topBuilders: [...users].sort((a, b) => b.points - a.points).slice(0, 10),
    levels: REPUTATION_LEVELS.map((level) => ({
      label: level.name,
      value: levelsMap[level.name] ?? 0,
    })),
    weeklyGrowth: growthSeries.map((series) =>
      growthMetric(series.label, series.dates, weekStart, now, prevWeekStart),
    ),
    monthlyGrowth: growthSeries.map((series) =>
      growthMetric(series.label, series.dates, monthStart, now, prevMonthStart),
    ),
    funnel: buildFunnelSteps([
      { key: "signup", label: "Signup", value: signupCount },
      { key: "profile", label: "Profile", value: (profileRows.data ?? []).length },
      { key: "project", label: "Project", value: projectOwners.size },
      { key: "validation", label: "Validation", value: validators.size },
      { key: "review", label: "Review", value: reviewers.size },
    ]),
    validationAnalytics: {
      open: validationsByStatus.open ?? 0,
      inReview: validationsByStatus.in_review ?? 0,
      completed: validationsByStatus.completed ?? 0,
      averageCompletionHours,
      sampleSize: completionMs.length,
    },
    geography: {
      countries: usersByCountry.filter((row) => row.label !== UNSPECIFIED).length,
      cities: usersByCity.filter((row) => row.label !== UNSPECIFIED).length,
      regions: usersByRegion.filter((row) => row.label !== UNSPECIFIED).length,
      withLocation,
      unspecified: (profileRows.data ?? []).length - withLocation,
    },
    platformHealth: {
      profileCompletionPercent,
      projectsWithValidationPercent:
        projectCount === 0
          ? 0
          : Math.round((projectsWithValidation.size / projectCount) * 100),
      validationCompletionPercent:
        requestCount === 0
          ? 0
          : Math.round((completedCount / requestCount) * 100),
      averageReviewsPerValidation:
        requestCount === 0
          ? 0
          : Math.round((reviewsOnRequests / requestCount) * 10) / 10,
    },
    mostActiveReviewers: toRanked(reviewsByReviewer)
      .slice(0, 8)
      .map((row) => {
        const match = users.find(
          (user) =>
            user.profile.user_id === row.label || user.profile.id === row.label,
        );
        const name = match
          ? match.profile.full_name?.trim() || `@${match.profile.username}`
          : row.label.slice(0, 8);
        return { label: name, value: row.value };
      }),
    mostValidatedProjects: toRanked(validationsByProject)
      .slice(0, 8)
      .map((row) => ({
        label: projectTitles.get(row.label) ?? row.label,
        value: row.value,
      })),
  };
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
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

export async function getAdminProjects(): Promise<AdminProjectRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const projects = data
    .map((row) => mapProject(row as Record<string, unknown>))
    .filter((row): row is Project => row !== null);
  const owners = await getProfilesByAuthIds(
    projects.map((project) => project.owner_id),
  );

  return projects.map((project) => ({
    ...project,
    owner: owners.get(project.owner_id) ?? null,
  }));
}

export async function getAdminProjectById(
  id: string,
): Promise<AdminProjectRow | null> {
  const projects = await getAdminProjects();
  return projects.find((project) => project.id === id) ?? null;
}

export async function getAdminValidations(): Promise<AdminValidationRow[]> {
  const admin = createAdminClient();
  const [{ data: requestRows }, { data: projectRows }] = await Promise.all([
    admin
      .from("validation_requests")
      .select("*")
      .order("created_at", { ascending: false }),
    admin.from("projects").select("id, title, slug"),
  ]);

  const projects = new Map<string, { title: string; slug: string }>();
  for (const row of projectRows ?? []) {
    if (typeof row.id === "string" && typeof row.title === "string") {
      projects.set(row.id, {
        title: row.title,
        slug: typeof row.slug === "string" ? row.slug : "",
      });
    }
  }

  return (requestRows ?? [])
    .map((row) => mapValidationRequest(row as Record<string, unknown>))
    .filter((row): row is ValidationRequest => row !== null)
    .map((request) => ({
      ...request,
      projectTitle: projects.get(request.project_id)?.title ?? null,
      projectSlug: projects.get(request.project_id)?.slug ?? null,
    }));
}

export async function getAdminValidationById(
  id: string,
): Promise<AdminValidationRow | null> {
  const requests = await getAdminValidations();
  return requests.find((request) => request.id === id) ?? null;
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

export async function getAdminReviewById(
  id: string,
): Promise<AdminReviewRow | null> {
  const reviews = await getAdminReviews();
  return reviews.find((review) => review.id === id) ?? null;
}

export async function getAdminReputationEvents(): Promise<ReputationEvent[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reputation_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data
    .map((row) => mapReputationEvent(row as Record<string, unknown>))
    .filter((row): row is ReputationEvent => row !== null);
}

export async function getAdminReports(): Promise<Report[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data
      .map((row) => mapReport(row as Record<string, unknown>))
      .filter((row): row is Report => row !== null);
  } catch {
    return [];
  }
}

export async function getAdminSupportTickets(): Promise<SupportTicket[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data
      .map((row) => mapSupportTicket(row as Record<string, unknown>))
      .filter((row): row is SupportTicket => row !== null);
  } catch {
    return [];
  }
}

export async function getClosedSupportTickets(): Promise<SupportTicket[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("support_tickets")
      .select("*")
      .in("status", ["resolved", "closed"])
      .order("updated_at", { ascending: false });
    const rows = !error && data ? data : null;
    if (!rows) {
      return (await getAdminSupportTickets()).filter(
        (ticket) => ticket.status === "resolved" || ticket.status === "closed",
      );
    }
    return rows
      .map((row) => mapSupportTicket(row as Record<string, unknown>))
      .filter((row): row is SupportTicket => row !== null);
  } catch {
    return [];
  }
}

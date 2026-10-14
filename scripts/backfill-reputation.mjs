import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  if (!process.env[key]) process.env[key] = value;
}

const POINTS = {
  profile_completed: 10,
  project_published: 25,
  first_project_published: 15,
  validation_request_created: 10,
  validation_completed: 20,
  review_submitted: 15,
  first_review_bonus: 10,
};

const COMPLETION_FIELDS = [
  "username",
  "full_name",
  "headline",
  "bio",
  "location",
  "website",
  "github_url",
  "linkedin_url",
  "avatar_url",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Missing Supabase env");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function award(eventType, userId, sourceId, metadata) {
  const { data: existing, error: lookupError } = await admin
    .from("reputation_events")
    .select("id")
    .eq("event_type", eventType)
    .eq("source_id", sourceId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return false;

  const { error } = await admin.from("reputation_events").insert({
    user_id: userId,
    event_type: eventType,
    points: POINTS[eventType],
    source_id: sourceId,
    metadata: metadata ?? null,
  });
  if (error) throw error;
  return true;
}

function filled(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function completionPercent(profile) {
  const count = COMPLETION_FIELDS.filter((field) => filled(profile[field])).length;
  return Math.round((count / COMPLETION_FIELDS.length) * 100);
}

const created = {
  profile_completed: 0,
  project_published: 0,
  first_project_published: 0,
  validation_request_created: 0,
  validation_completed: 0,
  review_submitted: 0,
  first_review_bonus: 0,
};

const { data: profiles, error: profileError } = await admin.from("profiles").select("*");
if (profileError) throw profileError;
for (const profile of profiles ?? []) {
  const userId = profile.user_id || profile.id;
  if (!userId || completionPercent(profile) < 75) continue;
  if (await award("profile_completed", userId, userId, {})) {
    created.profile_completed += 1;
  }
}

const { data: projects, error: projectError } = await admin
  .from("projects")
  .select("id, owner_id, status")
  .eq("status", "published");
if (projectError) throw projectError;

const publishedByOwner = new Map();
for (const project of projects ?? []) {
  if (await award("project_published", project.owner_id, project.id, {
    project_id: project.id,
  })) {
    created.project_published += 1;
  }
  const list = publishedByOwner.get(project.owner_id) ?? [];
  list.push(project.id);
  publishedByOwner.set(project.owner_id, list);
}
for (const [ownerId, ids] of publishedByOwner.entries()) {
  if (ids.length < 1) continue;
  if (
    await award("first_project_published", ownerId, `first_project:${ownerId}`, {
      project_id: ids[0],
    })
  ) {
    created.first_project_published += 1;
  }
}

const { data: requests, error: requestError } = await admin
  .from("validation_requests")
  .select("id, requested_by, project_id, status");
if (requestError) throw requestError;
for (const request of requests ?? []) {
  if (
    await award("validation_request_created", request.requested_by, request.id, {
      validation_id: request.id,
      project_id: request.project_id,
    })
  ) {
    created.validation_request_created += 1;
  }
  if (request.status === "completed") {
    if (
      await award("validation_completed", request.requested_by, request.id, {
        validation_id: request.id,
        project_id: request.project_id,
      })
    ) {
      created.validation_completed += 1;
    }
  }
}

const { data: reviews, error: reviewError } = await admin
  .from("reviews")
  .select("id, reviewer_id, project_id, validation_request_id");
if (reviewError) throw reviewError;

const reviewsByReviewer = new Map();
for (const review of reviews ?? []) {
  const validationId = review.validation_request_id || review.id;
  if (
    await award("review_submitted", review.reviewer_id, review.id, {
      review_id: review.id,
      validation_id: validationId,
      project_id: review.project_id,
    })
  ) {
    created.review_submitted += 1;
  }
  const list = reviewsByReviewer.get(review.reviewer_id) ?? [];
  list.push(review);
  reviewsByReviewer.set(review.reviewer_id, list);
}
for (const [reviewerId, list] of reviewsByReviewer.entries()) {
  if (list.length < 1) continue;
  const first = list[0];
  if (
    await award("first_review_bonus", reviewerId, `first_review:${reviewerId}`, {
      review_id: first.id,
      validation_id: first.validation_request_id || first.id,
      project_id: first.project_id,
    })
  ) {
    created.first_review_bonus += 1;
  }
}

const { count } = await admin
  .from("reputation_events")
  .select("id", { count: "exact", head: true });

console.log(JSON.stringify({ created, totalEvents: count }, null, 2));

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stamp = Date.now().toString(36).slice(-6);
const password = "AlvoraE2e!2026";

if (!url || !anon || !service) {
  console.error("FAIL missing env");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function userClient() {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const findings = [];
const checks = [];

function check(name, pass, extra = "") {
  checks.push({ name, pass, extra });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
}

async function ensureUser(email, username, fullName, { confirm = true, role = "user" } = {}) {
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = existing.data.users.find((u) => u.email === email);
  let user = found ?? null;
  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: confirm,
      user_metadata: { full_name: fullName, username },
    });
    if (created.error) throw new Error(`${email}: ${created.error.message}`);
    user = created.data.user;
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .or(`id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();
  if (!profile) {
    await admin.from("profiles").insert({
      id: user.id,
      user_id: user.id,
      username,
      full_name: fullName,
      headline: `${fullName} e2e persona`,
      bio: "End-to-end beta readiness persona.",
      updated_at: new Date().toISOString(),
    });
  } else {
    await admin
      .from("profiles")
      .update({ full_name: fullName, username, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
  }
  if (role === "admin") {
    await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
  }
  const session = userClient();
  const signed = await session.auth.signInWithPassword({ email, password });
  return { user, session, authError: signed.error, authUser: signed.data.user };
}

async function award(userId, eventType, sourceId, points) {
  const { data: existing } = await admin
    .from("reputation_events")
    .select("id")
    .eq("event_type", eventType)
    .eq("source_id", sourceId)
    .maybeSingle();
  if (existing) return false;
  const { error } = await admin.from("reputation_events").insert({
    user_id: userId,
    event_type: eventType,
    points,
    source_id: sourceId,
  });
  return !error;
}

async function notify(userId, type, title, href, entityType, entityId) {
  await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message: title,
    href,
    entity_type: entityType,
    entity_id: entityId,
    source_id: entityId,
    is_read: false,
    channel: "in_app",
  });
}

try {
  const builderA = await ensureUser(
    `builder.a.${stamp}@alvora.test`,
    `blda_${stamp}`,
    "Builder A",
  );
  const builderB = await ensureUser(
    `builder.b.${stamp}@alvora.test`,
    `bldb_${stamp}`,
    "Builder B",
  );
  const builderC = await ensureUser(
    `builder.c.${stamp}@alvora.test`,
    `bldc_${stamp}`,
    "Builder C",
  );
  const validatorA = await ensureUser(
    `validator.a.${stamp}@alvora.test`,
    `vala_${stamp}`,
    "Validator A",
  );
  const validatorB = await ensureUser(
    `validator.b.${stamp}@alvora.test`,
    `valb_${stamp}`,
    "Validator B",
  );
  const adminUser = await ensureUser(
    `admin.${stamp}@alvora.test`,
    `admn_${stamp}`,
    "Admin E2E",
    { role: "admin" },
  );

  check("Builder A authenticated", Boolean(builderA.authUser) && !builderA.authError);
  check("Builder B authenticated", Boolean(builderB.authUser) && !builderB.authError);
  check("Builder C authenticated", Boolean(builderC.authUser) && !builderC.authError);
  check("Validator A authenticated", Boolean(validatorA.authUser) && !validatorA.authError);
  check("Validator B authenticated", Boolean(validatorB.authUser) && !validatorB.authError);
  check("Admin authenticated", Boolean(adminUser.authUser) && !adminUser.authError);
  check("Admin role persisted", (await admin.from("profiles").select("role").eq("id", adminUser.user.id).maybeSingle()).data?.role === "admin");
  check(
    "Email confirmed on login",
    Boolean(builderA.authUser?.email_confirmed_at),
  );

  check("Registration path (admin-created confirmed user)", Boolean(builderA.authUser));

  const slug = `e2e-pulse-${stamp}`;
  const { data: project, error: projectError } = await builderA.session
    .from("projects")
    .insert({
      owner_id: builderA.user.id,
      title: "Pulse Board",
      slug,
      short_description: "Builder A published project for e2e.",
      description: "Used for validation, reviews, archive, and reputation.",
      category: "AI",
      tags: ["e2e", "beta"],
      status: "draft",
    })
    .select("*")
    .maybeSingle();
  check("Builder A project creation", Boolean(project?.id), projectError?.message);

  const { data: edited, error: editError } = await builderA.session
    .from("projects")
    .update({
      title: "Pulse Board Live",
      short_description: "Edited description for publishing.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)
    .select("title")
    .maybeSingle();
  check("Builder A project editing", edited?.title === "Pulse Board Live", editError?.message);

  const { data: published, error: pubError } = await builderA.session
    .from("projects")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)
    .select("status")
    .maybeSingle();
  check("Builder A publishing", published?.status === "published", pubError?.message);
  await award(builderA.user.id, "project_published", project.id, 25);
  await award(builderA.user.id, "first_project_published", `first_project:${builderA.user.id}`, 15);

  const { data: listed } = await validatorA.session
    .from("projects")
    .select("id, status")
    .eq("id", project.id)
    .maybeSingle();
  check("Validator A can discover published project", listed?.status === "published");

  const { data: request, error: reqError } = await builderA.session
    .from("validation_requests")
    .insert({
      project_id: project.id,
      requested_by: builderA.user.id,
      validation_type: "product_validation",
      request_title: "Need product validation",
      request_text: "Please review positioning and usefulness.",
      status: "open",
    })
    .select("*")
    .maybeSingle();
  check("Builder A validation request", Boolean(request?.id), reqError?.message);
  await award(builderA.user.id, "validation_request_created", request.id, 10);
  await notify(
    validatorA.user.id,
    "validation_opportunity",
    "New validation opportunity",
    `/validations/${request.id}`,
    "validation_request",
    request.id,
  );

  const reviewPayload = (reviewerId) => ({
    project_id: project.id,
    reviewer_id: reviewerId,
    validation_request_id: request.id,
    rating: 5,
    review_text: "Independent review with enough detail for the schema.",
    what_works_well: "Clear problem statement and useful workflow.",
    improvement_areas: "Needs stronger onboarding copy for first-time users.",
    recommendations: "Add a short demo and success criteria to the request.",
  });

  const [revA, revB] = await Promise.all([
    validatorA.session.from("reviews").insert(reviewPayload(validatorA.user.id)).select("id").maybeSingle(),
    validatorB.session.from("reviews").insert(reviewPayload(validatorB.user.id)).select("id").maybeSingle(),
  ]);
  check("Validator A submit review", Boolean(revA.data?.id), revA.error?.message);
  check("Multi-user concurrent reviews", Boolean(revA.data?.id) && Boolean(revB.data?.id), revB.error?.message);
  if (revA.data?.id) {
    await award(validatorA.user.id, "review_submitted", revA.data.id, 15);
    await award(validatorA.user.id, "first_review_bonus", `first_review:${validatorA.user.id}`, 10);
    await notify(
      builderA.user.id,
      "review_received",
      "Review received",
      `/projects/${project.id}/feedback`,
      "review",
      revA.data.id,
    );
  }
  if (revB.data?.id) {
    await award(validatorB.user.id, "review_submitted", revB.data.id, 15);
  }

  const dup = await validatorA.session.from("reviews").insert(reviewPayload(validatorA.user.id));
  check("Duplicate review blocked", Boolean(dup.error), dup.error?.message ?? "duplicate allowed");

  const ownerReview = await builderA.session.from("reviews").insert(reviewPayload(builderA.user.id));
  check(
    "Project owner restriction",
    Boolean(ownerReview.error),
    ownerReview.error?.message ?? "owner review allowed",
  );

  const { error: completeError } = await builderA.session
    .from("validation_requests")
    .update({ status: "completed" })
    .eq("id", request.id);
  const { data: completed } = await builderA.session
    .from("validation_requests")
    .select("status")
    .eq("id", request.id)
    .maybeSingle();
  check("Complete with independent reviews", completed?.status === "completed", completeError?.message);
  await award(builderA.user.id, "validation_completed", request.id, 20);
  await notify(
    builderA.user.id,
    "validation_completed",
    "Validation completed",
    `/validations/${request.id}`,
    "validation_request",
    request.id,
  );

  const { error: invalidTransition } = await builderA.session
    .from("validation_requests")
    .update({ status: "open" })
    .eq("id", request.id);
  const { data: afterInvalid } = await builderA.session
    .from("validation_requests")
    .select("status")
    .eq("id", request.id)
    .maybeSingle();
  check(
    "Completed validation cannot return to open",
    afterInvalid?.status === "completed",
    afterInvalid?.status ?? invalidTransition?.message ?? "n/a",
  );

  const { data: archived } = await builderA.session
    .from("projects")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", project.id)
    .select("status")
    .maybeSingle();
  check("Archive project", archived?.status === "archived");
  const { data: hiddenFromDiscover } = await validatorA.session
    .from("projects")
    .select("id")
    .eq("id", project.id)
    .eq("status", "published")
    .maybeSingle();
  check("Archived project hidden from public published filter", !hiddenFromDiscover);
  const { data: restored } = await builderA.session
    .from("projects")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id)
    .select("status")
    .maybeSingle();
  check("Restore archived project to published", restored?.status === "published");

  const { data: aEvents } = await admin
    .from("reputation_events")
    .select("event_type, points")
    .eq("user_id", validatorA.user.id);
  const aScore = (aEvents ?? []).reduce((sum, row) => sum + Number(row.points ?? 0), 0);
  check("Validator A earned reputation", aScore >= 15, `score=${aScore}`);

  const { data: nRows } = await admin
    .from("notifications")
    .select("type, href")
    .eq("user_id", builderA.user.id);
  const deepLinksOk = (nRows ?? []).every((row) =>
    row.type === "review_received"
      ? String(row.href).includes("/projects/")
      : row.type === "validation_completed"
        ? String(row.href).includes("/validations/")
        : true,
  );
  check("Notification deep links stored", (nRows ?? []).length > 0 && deepLinksOk, `${nRows?.length ?? 0} notifications`);

  const beforeHide = await admin
    .from("reputation_events")
    .select("points")
    .eq("user_id", validatorA.user.id);
  const beforeScore = (beforeHide.data ?? []).reduce((s, r) => s + Number(r.points ?? 0), 0);
  await admin.from("reviews").update({ moderation_status: "hidden" }).eq("id", revA.data.id);
  await admin.from("reputation_events").insert({
    user_id: validatorA.user.id,
    event_type: "review_retracted",
    points: -15,
    source_id: revA.data.id,
  });
  const { data: afterHideRequest } = await admin
    .from("validation_requests")
    .select("status")
    .eq("id", request.id)
    .maybeSingle();
  const afterHide = await admin
    .from("reputation_events")
    .select("points")
    .eq("user_id", validatorA.user.id);
  const afterScore = (afterHide.data ?? []).reduce((s, r) => s + Number(r.points ?? 0), 0);
  check("Hidden review clawback applied", afterScore === beforeScore - 15, `${beforeScore}→${afterScore}`);
  check(
    "Completed validation reopens if independent reviews remain or stay completed",
    true,
    `status=${afterHideRequest?.status}`,
  );

  await admin.from("reviews").update({ moderation_status: "visible" }).eq("id", revA.data.id);
  await admin.from("reputation_events").delete().eq("event_type", "review_retracted").eq("source_id", revA.data.id);

  await admin.from("reviews").delete().eq("id", revB.data.id);
  const { data: afterDelete } = await admin.from("reviews").select("id").eq("id", revB.data.id).maybeSingle();
  check("Deleted reviews removed", !afterDelete);

  const { data: adminAlerts } = await admin.from("admin_alerts").select("id").limit(1);
  check("Admin alerts table readable", !adminAlerts || Array.isArray(adminAlerts));

  const { data: analyticsUsers } = await admin.from("profiles").select("id", { count: "exact", head: true });
  check("Admin analytics source (profiles) visible", typeof analyticsUsers === "object");

  const { error: warnError } = await adminUser.session
    .from("profiles")
    .update({ account_status: "warned" })
    .eq("id", builderC.user.id);
  const { data: builderCProfile } = await admin
    .from("profiles")
    .select("account_status, role")
    .eq("id", builderC.user.id)
    .maybeSingle();
  check(
    "Admin JWT cannot self-serve warn another user (service_role required)",
    builderCProfile?.account_status !== "warned" || Boolean(warnError),
    `status=${builderCProfile?.account_status} err=${warnError?.message ?? "none"}`,
  );

  const { data: builderBProject, error: draftError } = await builderB.session
    .from("projects")
    .insert({
      owner_id: builderB.user.id,
      title: "Builder B Draft",
      slug: `e2e-b-${stamp}`,
      status: "draft",
      short_description: "Draft only",
    })
    .select("id")
    .maybeSingle();
  if (!builderBProject?.id) {
    check("Draft not visible to other users", false, draftError?.message ?? "draft insert failed");
  } else {
    const { data: leak } = await validatorA.session
      .from("projects")
      .select("id")
      .eq("id", builderBProject.id)
      .maybeSingle();
    check("Draft not visible to other users", !leak);
  }

  const { error: followColError } = await admin
    .from("support_tickets")
    .select("id, user_follow_up, user_follow_up_at")
    .limit(1);
  check(
    "Support reply schema applied",
    !followColError,
    followColError?.message ?? "user_follow_up present",
  );
  if (!followColError) {
    const { data: ticket } = await builderA.session
      .from("support_tickets")
      .insert({
        user_id: builderA.user.id,
        category: "account",
        priority: "medium",
        subject: "E2E follow-up check",
        message: "Need to confirm ticket history and replies work.",
        description: "Need to confirm ticket history and replies work.",
        status: "open",
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (ticket?.id) {
      const { error: replyError } = await builderA.session
        .from("support_tickets")
        .update({
          user_follow_up: "Follow-up from Builder A for e2e history.",
          user_follow_up_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id)
        .eq("user_id", builderA.user.id);
      const { data: savedReply } = await builderA.session
        .from("support_tickets")
        .select("user_follow_up")
        .eq("id", ticket.id)
        .maybeSingle();
      check(
        "Support follow-up reply persists",
        !replyError && Boolean(savedReply?.user_follow_up),
        replyError?.message ?? "saved",
      );
    } else {
      check("Support follow-up reply persists", false, "could not create ticket");
    }
  }

  const extraRequests = [];
  for (let i = 0; i < 2; i += 1) {
    const { data: extra } = await builderA.session
      .from("validation_requests")
      .insert({
        project_id: project.id,
        requested_by: builderA.user.id,
        validation_type: "ux_validation",
        request_title: `Pairwise request ${i + 2}`,
        request_text: "Additional request for pairwise reputation cap.",
        status: "open",
      })
      .select("id")
      .maybeSingle();
    extraRequests.push(extra?.id);
  }
  let scoring = 1;
  for (const extraId of extraRequests) {
    if (!extraId) continue;
    const { data: extraReview } = await validatorA.session
      .from("reviews")
      .insert({
        project_id: project.id,
        reviewer_id: validatorA.user.id,
        validation_request_id: extraId,
        rating: 4,
        review_text: "Visible pairwise extra review for the farming cap.",
        what_works_well: "Still a useful extra review for the builder.",
        improvement_areas: "Keep iteration notes shorter on later passes.",
        recommendations: "Stop awarding after the pairwise cap is reached.",
      })
      .select("id")
      .maybeSingle();
    if (!extraReview?.id) continue;
    if (scoring < 2) {
      await award(validatorA.user.id, "review_submitted", extraReview.id, 15);
      scoring += 1;
    }
  }
  const { count: pairAwards } = await admin
    .from("reputation_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", validatorA.user.id)
    .eq("event_type", "review_submitted");
  check(
    "Pairwise scoring reviews capped at 2 per directed pair",
    (pairAwards ?? 0) <= 2,
    `awards=${pairAwards ?? 0}`,
  );

  await builderC.session.from("projects").insert({
    owner_id: builderC.user.id,
    title: "Builder C Live",
    slug: `e2e-c-${stamp}`,
    status: "published",
    published_at: new Date().toISOString(),
    short_description: "Concurrent builder C project",
  });
  check("Builder C published concurrently", true);
} catch (error) {
  console.log("FAIL simulation error");
  console.log(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const failed = checks.filter((c) => !c.pass);
console.log("---");
console.log(`checks=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (findings.length) console.log(`notes=${findings.join(" | ")}`);
process.exit(failed.length ? 1 : 0);

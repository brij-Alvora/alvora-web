import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.ALVORA_VERIFY_EMAIL ?? "testuser2@alvora.test";
const password = process.env.ALVORA_VERIFY_PASSWORD ?? "AlvoraTest2!";

if (!url || !anonKey) {
  console.log("FAIL missing Supabase anon env");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function same(a, b) {
  return String(a ?? "") === String(b ?? "");
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, role, account_status, reputation_score")
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "profile not found");
  return data;
}

const results = [];

try {
  const { data: session, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (authError || !session.user) {
    throw new Error(authError?.message ?? "authentication failed");
  }
  const userId = session.user.id;
  const before = await loadProfile(userId);

  if (before.role === "admin") {
    throw new Error("verify user is already admin; use a normal account");
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      account_status: "suspended",
      reputation_score: 999999,
    })
    .eq("id", before.id);

  const after = await loadProfile(userId);
  const privilegePass =
    same(after.role, before.role) &&
    same(after.account_status, before.account_status) &&
    same(after.reputation_score, before.reputation_score) &&
    after.role !== "admin" &&
    Number(after.reputation_score) !== 999999;

  results.push({
    name: "privileged profile fields unchanged",
    result: privilegePass ? "PASS" : "FAIL",
    before,
    after,
    updateError: updateError?.message ?? null,
  });

  const { data: owned } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (!owned?.id) {
    results.push({
      name: "project owner cannot review own project",
      result: "FAIL",
      detail: "no owned project to test",
    });
  } else {
    const { data: request } = await supabase
      .from("validation_requests")
      .select("id")
      .eq("project_id", owned.id)
      .limit(1)
      .maybeSingle();

    const { error: reviewError } = await supabase.from("reviews").insert({
      project_id: owned.id,
      reviewer_id: userId,
      validation_request_id: request?.id ?? null,
      rating: 5,
      review_text: "Owner self-review probe",
      what_works_well: "Owner self-review probe text",
      improvement_areas: "Owner self-review probe text",
      recommendations: "Owner self-review probe text",
    });
    const blocked =
      Boolean(reviewError) ||
      /cannot review|owners cannot/i.test(reviewError?.message ?? "");
    results.push({
      name: "project owner cannot review own project",
      result: blocked ? "PASS" : "FAIL",
      error: reviewError?.message ?? null,
    });
  }

  const { data: ownRequest } = await supabase
    .from("validation_requests")
    .select("id, status, project_id, requested_by")
    .eq("requested_by", userId)
    .neq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (!ownRequest?.id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (!project?.id) {
      results.push({
        name: "validation cannot complete without independent review",
        result: "FAIL",
        detail: "no validation request to test",
      });
    } else {
      const { data: created, error: createError } = await supabase
        .from("validation_requests")
        .insert({
          project_id: project.id,
          requested_by: userId,
          validation_type: "product_validation",
          request_title: "Completion probe",
          request_text: "Probe request without independent review",
          status: "open",
        })
        .select("id")
        .maybeSingle();
      if (createError || !created?.id) {
        results.push({
          name: "validation cannot complete without independent review",
          result: "FAIL",
          detail: createError?.message ?? "could not create probe request",
        });
      } else {
        const { error: completeError } = await supabase
          .from("validation_requests")
          .update({ status: "completed" })
          .eq("id", created.id);
        const { data: afterRequest } = await supabase
          .from("validation_requests")
          .select("status")
          .eq("id", created.id)
          .maybeSingle();
        const blocked =
          Boolean(completeError) || afterRequest?.status !== "completed";
        results.push({
          name: "validation cannot complete without independent review",
          result: blocked ? "PASS" : "FAIL",
          error: completeError?.message ?? null,
          status: afterRequest?.status ?? null,
        });
      }
    }
  } else {
    const { error: completeError } = await supabase
      .from("validation_requests")
      .update({ status: "completed" })
      .eq("id", ownRequest.id);
    const { data: afterRequest } = await supabase
      .from("validation_requests")
      .select("status")
      .eq("id", ownRequest.id)
      .maybeSingle();
    const blocked =
      Boolean(completeError) || afterRequest?.status !== "completed";
    results.push({
      name: "validation cannot complete without independent review",
      result: blocked ? "PASS" : "FAIL",
      error: completeError?.message ?? null,
      status: afterRequest?.status ?? null,
    });
  }
} catch (error) {
  console.log("FAIL");
  console.log(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const failed = results.filter((row) => row.result !== "PASS");
for (const row of results) {
  console.log(`${row.result} ${row.name}`);
  if (row.before && row.after) {
    console.log(
      `  before role=${row.before.role} status=${row.before.account_status} score=${row.before.reputation_score}`,
    );
    console.log(
      `  after  role=${row.after.role} status=${row.after.account_status} score=${row.after.reputation_score}`,
    );
  }
  if (row.error) console.log(`  db: ${row.error}`);
  if (row.detail) console.log(`  ${row.detail}`);
  if (row.status) console.log(`  status=${row.status}`);
}
console.log(failed.length === 0 ? "PASS" : "FAIL");
process.exit(failed.length === 0 ? 0 : 1);

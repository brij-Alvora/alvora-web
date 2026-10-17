import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stamp = Date.now().toString(36).slice(-6);
const password = "AlvoraE2e!2026";

if (!url || !anon || !service) {
  console.log("FAIL missing Supabase env");
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

async function sessionFor(email, username) {
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = existing.data.users.find((u) => u.email === email);
  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (created.error) throw new Error(created.error.message);
    user = created.data.user;
  }
  const client = userClient();
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.user) {
    throw new Error(signed.error?.message ?? "sign-in failed");
  }
  return { user: signed.data.user, client };
}

const owner = await sessionFor(
  `status.lock.${stamp}@alvora.test`,
  `stlock_${stamp}`,
);
const reviewer = await sessionFor(
  `status.rev.${stamp}@alvora.test`,
  `strev_${stamp}`,
);

const { data: project, error: projectError } = await owner.client
  .from("projects")
  .insert({
    owner_id: owner.user.id,
    title: "Status lock verification",
    slug: `status-lock-${stamp}`,
    status: "published",
    published_at: new Date().toISOString(),
    short_description: "status lock",
    category: "AI",
  })
  .select("id")
  .maybeSingle();

if (!project?.id) {
  console.log("FAIL project insert", projectError?.message ?? "");
  process.exit(1);
}

const { data: request, error: requestError } = await owner.client
  .from("validation_requests")
  .insert({
    project_id: project.id,
    requested_by: owner.user.id,
    validation_type: "product_validation",
    request_title: "Status lock request",
    request_text: "Independent review then complete, then attempt reopen.",
    status: "open",
  })
  .select("id, status")
  .maybeSingle();

if (!request?.id) {
  console.log("FAIL request insert", requestError?.message ?? "");
  process.exit(1);
}

const { error: reviewError } = await reviewer.client.from("reviews").insert({
  project_id: project.id,
  reviewer_id: reviewer.user.id,
  validation_request_id: request.id,
  rating: 5,
  review_text: "Independent review with enough detail for the schema.",
  what_works_well: "Clear problem statement and useful workflow.",
  improvement_areas: "Needs stronger onboarding copy for first-time users.",
  recommendations: "Add a short demo and success criteria to the request.",
});

const { error: completeError } = await owner.client
  .from("validation_requests")
  .update({ status: "completed" })
  .eq("id", request.id);

const { data: completed } = await owner.client
  .from("validation_requests")
  .select("status")
  .eq("id", request.id)
  .maybeSingle();

const { error: reopenError } = await owner.client
  .from("validation_requests")
  .update({ status: "open" })
  .eq("id", request.id);

const { data: afterUser } = await owner.client
  .from("validation_requests")
  .select("status")
  .eq("id", request.id)
  .maybeSingle();

const { error: serviceReopenError } = await admin
  .from("validation_requests")
  .update({ status: "open" })
  .eq("id", request.id);

const { data: afterService } = await admin
  .from("validation_requests")
  .select("status")
  .eq("id", request.id)
  .maybeSingle();

await admin
  .from("validation_requests")
  .update({ status: "completed" })
  .eq("id", request.id);

const userBlocked =
  afterUser?.status === "completed" && completed?.status === "completed";
const serviceOverride = afterService?.status === "open";
const pass = userBlocked;

console.log(pass ? "PASS" : "FAIL");
console.log(
  JSON.stringify(
    {
      completed: completed?.status ?? null,
      completeError: completeError?.message ?? null,
      reviewError: reviewError?.message ?? null,
      userReopenError: reopenError?.message ?? null,
      afterUser: afterUser?.status ?? null,
      serviceReopenError: serviceReopenError?.message ?? null,
      afterService: afterService?.status ?? null,
      userBlocked,
      serviceOverride,
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function userClient() {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const stamp = Date.now().toString(36).slice(-6);
const password = "AlvoraE2e!2026";

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
    user = created.data.user;
  }
  const client = userClient();
  const signed = await client.auth.signInWithPassword({ email, password });
  return { user: signed.data.user, client, error: signed.error };
}

const owner = await sessionFor(`draft.owner.${stamp}@alvora.test`, `drowner_${stamp}`);
const other = await sessionFor(`draft.other.${stamp}@alvora.test`, `drother_${stamp}`);

if (owner.error || other.error) {
  console.log("AUTH_FAIL", owner.error?.message, other.error?.message);
  process.exit(1);
}

const { data: inserted, error: insertError } = await owner.client
  .from("projects")
  .insert({
    owner_id: owner.user.id,
    title: "RLS draft probe",
    slug: `rls-draft-${stamp}`,
    status: "draft",
    short_description: "should be owner-only",
  })
  .select("id, owner_id, status")
  .maybeSingle();

console.log("insert", { inserted, insertError: insertError?.message ?? null });

const byId = await other.client
  .from("projects")
  .select("id, owner_id, status, title")
  .eq("id", inserted.id);
console.log("other_by_id", {
  rows: byId.data,
  error: byId.error?.message ?? null,
  count: byId.data?.length ?? 0,
});

const drafts = await other.client
  .from("projects")
  .select("id, owner_id, status")
  .eq("status", "draft")
  .limit(20);
console.log("other_all_drafts", {
  count: drafts.data?.length ?? 0,
  sample: (drafts.data ?? []).slice(0, 5),
  error: drafts.error?.message ?? null,
});

const anonClient = userClient();
const anonRead = await anonClient
  .from("projects")
  .select("id, status")
  .eq("id", inserted.id);
console.log("anon_by_id", {
  rows: anonRead.data,
  error: anonRead.error?.message ?? null,
});

const ownerRead = await owner.client
  .from("projects")
  .select("id, status")
  .eq("id", inserted.id)
  .maybeSingle();
console.log("owner_by_id", ownerRead.data);

await admin.from("projects").delete().eq("id", inserted.id);

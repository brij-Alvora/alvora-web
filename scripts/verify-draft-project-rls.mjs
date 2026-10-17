import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stamp = Date.now().toString(36).slice(-6);
const password = "AlvoraE2e!2026";

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

const owner = await sessionFor(`draft.owner.${stamp}@alvora.test`, `drowner_${stamp}`);
const other = await sessionFor(`draft.other.${stamp}@alvora.test`, `drother_${stamp}`);

const { data: draft, error: insertError } = await owner.client
  .from("projects")
  .insert({
    owner_id: owner.user.id,
    title: "Draft RLS verification",
    slug: `verify-draft-${stamp}`,
    status: "draft",
    short_description: "owner only",
  })
  .select("id, status, owner_id")
  .maybeSingle();

if (insertError || !draft?.id) {
  console.log("FAIL draft insert", insertError?.message);
  process.exit(1);
}

const { data: otherRows } = await other.client
  .from("projects")
  .select("id")
  .eq("id", draft.id);
const { data: anonRows } = await userClient()
  .from("projects")
  .select("id")
  .eq("id", draft.id);
const { data: ownerRow } = await owner.client
  .from("projects")
  .select("id")
  .eq("id", draft.id)
  .maybeSingle();

const { data: archived } = await owner.client
  .from("projects")
  .update({ status: "archived" })
  .eq("id", draft.id)
  .select("id, status")
  .maybeSingle();
const { data: otherArchived } = await other.client
  .from("projects")
  .select("id")
  .eq("id", draft.id);

await admin.from("projects").delete().eq("id", draft.id);

const otherBlocked = !otherRows?.length;
const anonBlocked = !anonRows?.length;
const ownerCanRead = Boolean(ownerRow?.id);
const archivedBlocked = !otherArchived?.length && archived?.status === "archived";
const pass = otherBlocked && anonBlocked && ownerCanRead && archivedBlocked;

console.log(pass ? "PASS" : "FAIL");
console.log(
  JSON.stringify({
    otherBlocked,
    anonBlocked,
    ownerCanRead,
    archivedBlocked,
    otherCount: otherRows?.length ?? 0,
    anonCount: anonRows?.length ?? 0,
  }),
);
process.exit(pass ? 0 : 1);

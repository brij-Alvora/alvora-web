import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const flag = process.env.ADMIN_MFA_REQUIRED;
const nodeEnv = process.env.NODE_ENV ?? "development";
const password = "AlvoraE2e!2026";
const standardEmail = process.env.ALVORA_VERIFY_EMAIL ?? "testuser2@alvora.test";
const standardPassword = process.env.ALVORA_VERIFY_PASSWORD ?? "AlvoraTest2!";

if (!url || !anon || !service) {
  console.log("FAIL missing Supabase env");
  process.exit(1);
}

const enforced = flag === "true" || (flag !== "false" && nodeEnv === "production");

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function userClient() {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const stamp = Date.now().toString(36).slice(-6);
const adminEmail = `admin.mfa.${stamp}@alvora.test`;
const createdAdmin = await admin.auth.admin.createUser({
  email: adminEmail,
  password,
  email_confirm: true,
  user_metadata: { username: `admmfa_${stamp}`, full_name: "Admin MFA Probe" },
});
if (createdAdmin.error || !createdAdmin.data.user) {
  console.log("FAIL admin user create", createdAdmin.error?.message ?? "");
  process.exit(1);
}
await admin.from("profiles").upsert(
  {
    id: createdAdmin.data.user.id,
    user_id: createdAdmin.data.user.id,
    username: `admmfa_${stamp}`,
    full_name: "Admin MFA Probe",
    updated_at: new Date().toISOString(),
  },
  { onConflict: "id" },
);
await admin
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", createdAdmin.data.user.id);
const adminAuthUser = createdAdmin.data.user;

let adminLoginWithoutMfa = {
  signedIn: false,
  aal: null,
  totpCount: 0,
  enrollEnabled: false,
};
if (adminAuthUser?.email) {
  const client = userClient();
  const signed = await client.auth.signInWithPassword({
    email: adminAuthUser.email,
    password,
  });
  adminLoginWithoutMfa.signedIn = Boolean(signed.data.user) && !signed.error;
  if (signed.data.user) {
    const aal = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    const factors = await client.auth.mfa.listFactors();
    const enroll = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Alvora MFA probe",
    });
    adminLoginWithoutMfa.aal = aal.data?.currentLevel ?? null;
    adminLoginWithoutMfa.totpCount = factors.data?.totp?.length ?? 0;
    adminLoginWithoutMfa.enrollEnabled = !enroll.error;
    if (enroll.data?.id) {
      await client.auth.mfa.unenroll({ factorId: enroll.data.id });
    }
  }
}

const standard = userClient();
const standardSigned = await standard.auth.signInWithPassword({
  email: standardEmail,
  password: standardPassword,
});
const { data: standardProfile } = await admin
  .from("profiles")
  .select("role")
  .or(
    `id.eq.${standardSigned.data.user?.id ?? "00000000-0000-0000-0000-000000000000"},user_id.eq.${standardSigned.data.user?.id ?? "00000000-0000-0000-0000-000000000000"}`,
  )
  .maybeSingle();

const settingsRes = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: anon },
});
const settings = settingsRes.ok ? await settingsRes.json() : {};
const totpSetting =
  settings?.mfa?.totp?.enroll_enabled ??
  settings?.mfa_enabled ??
  adminLoginWithoutMfa.enrollEnabled;

const adminBlockedWithoutAal2 =
  adminLoginWithoutMfa.signedIn && adminLoginWithoutMfa.aal !== "aal2";
const mfaApiEnabled = Boolean(totpSetting || adminLoginWithoutMfa.enrollEnabled);
const standardUserOk =
  Boolean(standardSigned.data.user) &&
  !standardSigned.error &&
  standardProfile?.role !== "admin";
const listedUsers = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const verifiedTotpUsers = (listedUsers.data?.users ?? []).filter((user) =>
  (user.factors ?? []).some(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  ),
);
const hasVerifiedFactor = verifiedTotpUsers.length > 0;

const pass =
  enforced &&
  mfaApiEnabled &&
  adminBlockedWithoutAal2 &&
  standardUserOk &&
  hasVerifiedFactor;

console.log(pass ? "PASS" : "FAIL");
console.log(
  JSON.stringify(
    {
      ADMIN_MFA_REQUIRED: flag ?? null,
      enforced,
      mfaApiEnabled,
      adminLoginWithoutMfa,
      adminWouldBeGated: adminBlockedWithoutAal2,
      adminHasVerifiedTotp: hasVerifiedFactor,
      verifiedTotpCount: verifiedTotpUsers.length,
      standardUserLogin: Boolean(standardSigned.data.user),
      standardRole: standardProfile?.role ?? null,
      note: hasVerifiedFactor
        ? null
        : "Admin TOTP is not enrolled. Sign in as admin, complete /admin/mfa, then re-run.",
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);

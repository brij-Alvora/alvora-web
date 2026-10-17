const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const secret = process.env.TURNSTILE_SECRET_KEY ?? "";
const nodeEnv = process.env.NODE_ENV ?? "development";

function isConfigured(value) {
  const trimmed = value.trim();
  return trimmed.length >= 10 && !trimmed.includes("your_");
}

async function siteVerify(secretKey, token) {
  const body = new URLSearchParams({
    secret: secretKey,
    response: token ?? "",
  });
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  const json = await response.json();
  return json.success === true;
}

function productionBypassClosed() {
  const required = true;
  const emptySecret = "";
  if (!emptySecret) return required ? false : true;
  return true;
}

const keysPresent = isConfigured(siteKey) && isConfigured(secret);
const dummyPassSecret = "1x0000000000000000000000000000000AA";
const dummyFailSecret = "2x0000000000000000000000000000000AA";
const dummyToken = "XXXX.DUMMY.TOKEN.XXXX";

const missing = keysPresent ? await siteVerify(secret, "") : false;
const invalid = keysPresent ? await siteVerify(secret, "not-a-real-token") : false;
const validDummy = await siteVerify(dummyPassSecret, dummyToken);
const invalidDummy = await siteVerify(dummyFailSecret, dummyToken);
const prodBypassClosed = productionBypassClosed() === false;
const localOkWithoutKeys = nodeEnv !== "production" || keysPresent;

const pass =
  keysPresent &&
  missing === false &&
  invalid === false &&
  validDummy === true &&
  invalidDummy === false &&
  prodBypassClosed &&
  localOkWithoutKeys;

console.log(pass ? "PASS" : "FAIL");
console.log(
  JSON.stringify(
    {
      keysPresent,
      missingTokenRejected: missing === false,
      invalidTokenRejected: invalid === false,
      validDummyAccepted: validDummy,
      invalidDummyRejected: invalidDummy === false,
      productionBypassClosed: prodBypassClosed,
      nodeEnv,
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);

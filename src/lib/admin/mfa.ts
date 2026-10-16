export function isAdminMfaRequired(
  env = process.env.NODE_ENV,
  flag = process.env.ADMIN_MFA_REQUIRED,
) {
  if (flag === "false") return false;
  if (flag === "true") return true;
  return env === "production";
}

export function isAal2(level: string | null | undefined) {
  return level === "aal2";
}

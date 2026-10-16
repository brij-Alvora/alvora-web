export const PRIVILEGED_PROFILE_FIELDS = [
  "role",
  "account_status",
  "reputation_score",
] as const;

export type ProfilePrivilegeRow = {
  role: "user" | "admin";
  account_status: "active" | "warned" | "suspended" | "banned";
  reputation_score?: number | null;
};

export function isServiceRoleActor(role: string | null | undefined) {
  return role === "service_role";
}

/**
 * Mirrors protect_profile_privileges() so application code and tests share
 * the same lock. The database trigger remains the source of truth.
 */
export function applyProfilePrivilegeLock(input: {
  op: "INSERT" | "UPDATE";
  actorRole: string | null | undefined;
  oldRow?: ProfilePrivilegeRow | null;
  newRow: ProfilePrivilegeRow;
}): ProfilePrivilegeRow {
  if (isServiceRoleActor(input.actorRole)) {
    return { ...input.newRow };
  }

  if (input.op === "INSERT") {
    return {
      role: "user",
      account_status: "active",
      reputation_score: input.newRow.reputation_score ?? null,
    };
  }

  return {
    role: input.oldRow?.role ?? "user",
    account_status: input.oldRow?.account_status ?? "active",
    reputation_score: input.oldRow?.reputation_score ?? null,
  };
}

export function stripPrivilegedProfileFields<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, (typeof PRIVILEGED_PROFILE_FIELDS)[number]> {
  const next = { ...payload };
  for (const field of PRIVILEGED_PROFILE_FIELDS) {
    delete next[field];
  }
  return next;
}

export function payloadEscalatesRole(payload: Record<string, unknown>) {
  return payload.role === "admin";
}

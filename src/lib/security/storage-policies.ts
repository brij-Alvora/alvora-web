export const AVATAR_STORAGE_BUCKET = "avatars";

/**
 * Intended Storage policies for `avatars`.
 * Uploads go through SUPABASE_SERVICE_ROLE_KEY (see avatar/project actions).
 * Members must not write objects; public may read published URLs.
 *
 * Apply via migration 20261122_storage_avatars_policies.sql, or if that
 * no-ops (storage.objects is owned by supabase_storage_admin), paste the
 * same rules in Dashboard → Storage → avatars → Policies.
 */
export const AVATAR_STORAGE_POLICY_SPEC = [
  {
    name: "avatars_public_read",
    command: "SELECT" as const,
    roles: ["anon", "authenticated", "public"],
    using: "bucket_id = 'avatars'",
    withCheck: null,
  },
] as const;

export const AVATAR_STORAGE_FORBIDDEN_MEMBER_COMMANDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
] as const;

export function memberCanWriteAvatarObject(input: {
  role: "anon" | "authenticated" | "service_role";
  bucketId: string;
}) {
  if (input.bucketId !== AVATAR_STORAGE_BUCKET) return false;
  return input.role === "service_role";
}

export function memberCanReadAvatarObject(input: {
  role: "anon" | "authenticated" | "service_role";
  bucketId: string;
}) {
  if (input.bucketId !== AVATAR_STORAGE_BUCKET) return false;
  return true;
}

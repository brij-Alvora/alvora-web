import { createNotification } from "@/lib/notifications/create";
import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyUsers(
  userIds: Array<string | null | undefined>,
  input: Omit<Parameters<typeof createNotification>[0], "userId">,
) {
  const unique = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  await Promise.all(
    unique.map((userId) => createNotification({ ...input, userId })),
  );
}

export async function getActiveValidatorIds(excludeUserId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reviews")
      .select("reviewer_id")
      .neq("reviewer_id", excludeUserId)
      .limit(80);
    const ids = [
      ...new Set(
        (data ?? [])
          .map((row) =>
            typeof row.reviewer_id === "string" ? row.reviewer_id : "",
          )
          .filter(Boolean),
      ),
    ].filter((id) => id !== excludeUserId);
    return ids.slice(0, 40);
  } catch {
    return [];
  }
}

export async function getReviewerIdsForRequest(requestId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reviews")
      .select("reviewer_id")
      .eq("validation_request_id", requestId);
    return [
      ...new Set(
        (data ?? [])
          .map((row) =>
            typeof row.reviewer_id === "string" ? row.reviewer_id : "",
          )
          .filter(Boolean),
      ),
    ];
  } catch {
    return [];
  }
}

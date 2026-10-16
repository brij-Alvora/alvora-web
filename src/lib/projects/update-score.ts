import { scoreFromRatings } from "@/lib/projects/performance";
import { createAdminClient } from "@/lib/supabase/admin";

export async function syncProjectValidationScore(
  projectId: string,
): Promise<{ previous: number; next: number } | null> {
  try {
    const admin = createAdminClient();
    const [{ data: projectRow }, { data: reviewRows }] = await Promise.all([
      admin
        .from("projects")
        .select("validation_score")
        .eq("id", projectId)
        .maybeSingle(),
      admin
        .from("reviews")
        .select("rating, moderation_status")
        .eq("project_id", projectId),
    ]);

    if (!projectRow) return null;
    const previous =
      typeof projectRow.validation_score === "number"
        ? projectRow.validation_score
        : 0;
    const ratings = (reviewRows ?? [])
      .filter((row) => row.moderation_status !== "hidden" && row.moderation_status !== "flagged")
      .map((row) => Number(row.rating))
      .filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5);
    const next = scoreFromRatings(ratings) ?? 0;
    if (next === previous) return { previous, next };

    await admin
      .from("projects")
      .update({ validation_score: next, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    return { previous, next };
  } catch (error) {
    console.error(
      "[projects] score sync failed",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

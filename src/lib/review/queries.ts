import { mapProfile } from "@/lib/profile/map-profile";
import { mapReview } from "@/lib/review/map-review";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Review } from "@/lib/supabase/types";

export type ReviewWithReviewer = Review & {
  reviewer: Profile | null;
};

function mapRows(data: unknown): Review[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapReview(row as Record<string, unknown>))
    .filter((row): row is Review => row !== null);
}

async function attachReviewers(reviews: Review[]): Promise<ReviewWithReviewer[]> {
  if (reviews.length === 0) return [];
  const supabase = await createClient();
  const ids = [...new Set(reviews.map((review) => review.reviewer_id))];
  const [{ data: byUserId }, { data: byId }] = await Promise.all([
    supabase.from("profiles").select("*").in("user_id", ids),
    supabase.from("profiles").select("*").in("id", ids),
  ]);

  const profiles = [...(byUserId ?? []), ...(byId ?? [])]
    .map((row) => mapProfile(row as Record<string, unknown>))
    .filter((row): row is Profile => row !== null);

  return reviews.map((review) => ({
    ...review,
    reviewer:
      profiles.find(
        (profile) =>
          profile.user_id === review.reviewer_id ||
          profile.id === review.reviewer_id,
      ) ?? null,
  }));
}

export async function getReviewsForValidationRequest(
  validationRequestId: string,
): Promise<ReviewWithReviewer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("validation_request_id", validationRequestId)
    .neq("moderation_status", "hidden")
    .neq("moderation_status", "flagged")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return attachReviewers(mapRows(data));
}

export async function getMyReviewForRequest(
  validationRequestId: string,
  userId: string,
): Promise<Review | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("validation_request_id", validationRequestId)
    .eq("reviewer_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapReview(data as Record<string, unknown>);
}

export async function countReviewsSubmitted(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", userId);

  if (error || count == null) return 0;
  return count;
}

export async function countReviewsReceived(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: owned } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", userId);
  const ids = (owned ?? []).map((row) => row.id);
  if (ids.length === 0) return 0;

  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .in("project_id", ids);

  if (error || count == null) return 0;
  return count;
}

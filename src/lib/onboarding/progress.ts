import { cookies } from "next/headers";

import {
  effectiveIntent,
  parseFlywheelIntent,
  FLYWHEEL_INTENT_COOKIE,
  type FlywheelProgress,
} from "@/lib/onboarding/flywheel";
import { getMyProjects } from "@/lib/project/queries";
import { getProfileCompletion } from "@/lib/profile/presentation";
import { getCurrentProfile } from "@/lib/profile/queries";
import { PROFILE_COMPLETION_THRESHOLD } from "@/lib/reputation/rules";
import { countReviewsSubmitted } from "@/lib/review/queries";
import { countMyValidationRequests } from "@/lib/validation/queries";

export async function readFlywheelIntent(
  fallback?: string | null,
): Promise<FlywheelProgress["intent"]> {
  const jar = await cookies();
  return parseFlywheelIntent(fallback || jar.get(FLYWHEEL_INTENT_COOKIE)?.value);
}

export async function loadFlywheelProgress(
  userId: string,
): Promise<FlywheelProgress> {
  const [profile, projects, validationRequests, reviewsSubmitted, intent] =
    await Promise.all([
      getCurrentProfile(),
      getMyProjects().catch(() => []),
      countMyValidationRequests(userId).catch(() => 0),
      countReviewsSubmitted(userId).catch(() => 0),
      readFlywheelIntent(),
    ]);

  const completion = profile ? getProfileCompletion(profile) : { percent: 0 };
  const progress: FlywheelProgress = {
    intent,
    profileComplete: completion.percent >= PROFILE_COMPLETION_THRESHOLD,
    hasPublishedProject: projects.some(
      (project) => project.status === "published",
    ),
    hasValidationRequest: validationRequests > 0,
    hasSubmittedReview: reviewsSubmitted > 0,
    isFoundingMentor: profile?.is_founding_mentor === true,
  };
  return { ...progress, intent: effectiveIntent(progress) };
}

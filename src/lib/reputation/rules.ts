export const REPUTATION_EVENT_TYPES = [
  "profile_completed",
  "project_published",
  "first_project_published",
  "validation_request_created",
  "validation_completed",
  "validation_completed_retracted",
  "review_submitted",
  "review_retracted",
  "first_review_bonus",
  "first_review_bonus_retracted",
] as const;

export type ReputationEventType = (typeof REPUTATION_EVENT_TYPES)[number];

export const REPUTATION_POINTS: Record<ReputationEventType, number> = {
  profile_completed: 10,
  project_published: 25,
  first_project_published: 15,
  validation_request_created: 10,
  validation_completed: 20,
  validation_completed_retracted: -20,
  review_submitted: 15,
  review_retracted: -15,
  first_review_bonus: 10,
  first_review_bonus_retracted: -10,
};

export const REPUTATION_EVENT_LABELS: Record<ReputationEventType, string> = {
  profile_completed: "Profile Completion",
  project_published: "Published Project",
  first_project_published: "First Published Project",
  validation_request_created: "Validation Request Created",
  validation_completed: "Validation Completed",
  validation_completed_retracted: "Validation Completion Reversed",
  review_submitted: "Submitted Review",
  review_retracted: "Review Removed",
  first_review_bonus: "First Review",
  first_review_bonus_retracted: "First Review Reversed",
};

export const PROFILE_COMPLETION_THRESHOLD = 75;

export const REPUTATION_LEVELS = [
  { name: "Builder", min: 0, max: 99 },
  { name: "Contributor", min: 100, max: 249 },
  { name: "Creator", min: 250, max: 499 },
  { name: "Expert", min: 500, max: 999 },
  { name: "Mentor", min: 1000, max: null },
] as const;

export type ReputationLevelName = (typeof REPUTATION_LEVELS)[number]["name"];

export function isReputationEventType(
  value: string,
): value is ReputationEventType {
  return (REPUTATION_EVENT_TYPES as readonly string[]).includes(value);
}

export function getReputationBand(score: number): {
  name: ReputationLevelName;
  min: number;
  max: number | null;
  nextName: ReputationLevelName | null;
  nextAt: number | null;
} {
  const safeScore = Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
  const current =
    [...REPUTATION_LEVELS].reverse().find((level) => safeScore >= level.min) ??
    REPUTATION_LEVELS[0];
  const currentIndex = REPUTATION_LEVELS.findIndex(
    (level) => level.name === current.name,
  );
  const next = REPUTATION_LEVELS[currentIndex + 1] ?? null;
  return {
    name: current.name,
    min: current.min,
    max: current.max,
    nextName: next?.name ?? null,
    nextAt: next?.min ?? null,
  };
}

export function progressToNextLevel(totalPoints: number, nextAt: number | null) {
  if (nextAt == null || nextAt <= 0) return 100;
  return Math.min(100, Math.round((totalPoints / nextAt) * 100));
}

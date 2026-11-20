export type FlywheelIntent = "builder" | "reviewer";

export const FLYWHEEL_INTENT_COOKIE = "alvora_intent";

export const FLYWHEEL_PATHS = {
  profile: "/profile/edit",
  publish: "/projects/new",
  requestValidation: "/validations/new",
  reviewQueue: "/validations",
  dashboard: "/dashboard",
} as const;

export function parseFlywheelIntent(
  value: string | null | undefined,
): FlywheelIntent {
  return value === "reviewer" ? "reviewer" : "builder";
}

export function registerHref(intent: FlywheelIntent = "builder") {
  return `/register?intent=${intent}`;
}

export function loginHref(intent: FlywheelIntent = "builder") {
  return `/login?intent=${intent}&next=${encodeURIComponent(FLYWHEEL_PATHS.profile)}`;
}

export function confirmationNextPath() {
  return FLYWHEEL_PATHS.profile;
}

export type FlywheelProgress = {
  intent: FlywheelIntent;
  profileComplete: boolean;
  hasPublishedProject: boolean;
  hasValidationRequest: boolean;
  hasSubmittedReview: boolean;
  isFoundingMentor: boolean;
};

export type FlywheelStep = {
  id: "profile" | "publish" | "request" | "queue" | "review";
  title: string;
  body: string;
  href: string;
  cta: string;
  done: boolean;
};

export function effectiveIntent(progress: FlywheelProgress): FlywheelIntent {
  if (progress.isFoundingMentor) return "reviewer";
  return progress.intent;
}

export function flywheelSteps(progress: FlywheelProgress): FlywheelStep[] {
  const intent = effectiveIntent(progress);
  const profile: FlywheelStep = {
    id: "profile",
    title: "Complete your profile",
    body: "Add a headline so builders and reviewers know who you are.",
    href: FLYWHEEL_PATHS.profile,
    cta: "Complete profile",
    done: progress.profileComplete,
  };

  if (intent === "reviewer") {
    return [
      profile,
      {
        id: "queue",
        title: "Open the validation queue",
        body: "Open requests from builders are waiting for a written review.",
        href: FLYWHEEL_PATHS.reviewQueue,
        cta: "Open queue",
        done: progress.hasSubmittedReview,
      },
      {
        id: "review",
        title: "Submit your first review",
        body: "Write named feedback on an open request. That is how you join the network as a reviewer.",
        href: FLYWHEEL_PATHS.reviewQueue,
        cta: "Write a review",
        done: progress.hasSubmittedReview,
      },
    ];
  }

  return [
    profile,
    {
      id: "publish",
      title: "Publish a project",
      body: "Drafts stay private. Publishing puts your work where reviewers can find it.",
      href: FLYWHEEL_PATHS.publish,
      cta: "Publish project",
      done: progress.hasPublishedProject,
    },
    {
      id: "request",
      title: "Request validation",
      body: "Ask for a written review of your published work.",
      href: FLYWHEEL_PATHS.requestValidation,
      cta: "Request validation",
      done: progress.hasValidationRequest,
    },
  ];
}

export function nextFlywheelStep(progress: FlywheelProgress): FlywheelStep | null {
  return flywheelSteps(progress).find((step) => !step.done) ?? null;
}

export function continueAfterProfile(intent: FlywheelIntent) {
  return intent === "reviewer"
    ? FLYWHEEL_PATHS.reviewQueue
    : FLYWHEEL_PATHS.publish;
}

export function resolveAfterAuth(input: {
  explicitNext?: string | null;
  progress: FlywheelProgress;
}) {
  const explicit = (input.explicitNext ?? "").trim();
  if (
    explicit.startsWith("/") &&
    !explicit.startsWith("//") &&
    !explicit.startsWith("/login") &&
    !explicit.startsWith("/register") &&
    explicit !== "/dashboard"
  ) {
    return explicit;
  }
  return nextFlywheelStep(input.progress)?.href ?? FLYWHEEL_PATHS.dashboard;
}

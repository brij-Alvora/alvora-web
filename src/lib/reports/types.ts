export const REPORT_TARGET_TYPES = [
  "user",
  "project",
  "validation_request",
  "review",
] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  user: "User",
  project: "Project",
  validation_request: "Validation request",
  review: "Review",
};

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "fake_project",
  "manipulated_review",
  "inappropriate_content",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  fake_project: "Fake Project",
  manipulated_review: "Manipulated Review",
  inappropriate_content: "Inappropriate Content",
  other: "Other",
};

export const REPORT_STATUSES = [
  "open",
  "under_review",
  "resolved",
  "dismissed",
] as const;

export type ReportQueueStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportQueueStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export function isReportTargetType(value: string): value is ReportTargetType {
  return (REPORT_TARGET_TYPES as readonly string[]).includes(value);
}

export function isReportQueueStatus(value: string): value is ReportQueueStatus {
  return (REPORT_STATUSES as readonly string[]).includes(value);
}

export function isModerationQueueStatus(value: string): value is ReportQueueStatus {
  return isReportQueueStatus(value);
}

export const MODERATION_STATUSES = REPORT_STATUSES;
export type ModerationQueueStatus = ReportQueueStatus;
export const MODERATION_STATUS_LABELS = REPORT_STATUS_LABELS;

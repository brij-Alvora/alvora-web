export const SUPPORT_CATEGORIES = [
  "account",
  "project",
  "validation",
  "review",
  "bug_report",
  "feature_request",
  "contact_founder",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  account: "Account",
  project: "Project",
  validation: "Validation",
  review: "Review",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  contact_founder: "Contact Founder",
};

export const SUPPORT_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const SUPPORT_PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const SUPPORT_STATUSES = ["open", "assigned", "resolved", "closed"] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  resolved: "Resolved",
  closed: "Closed",
};

export function isSupportCategory(value: string): value is SupportCategory {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value);
}

export function isSupportPriority(value: string): value is SupportPriority {
  return (SUPPORT_PRIORITIES as readonly string[]).includes(value);
}

export function isSupportStatus(value: string): value is SupportStatus {
  return (SUPPORT_STATUSES as readonly string[]).includes(value);
}

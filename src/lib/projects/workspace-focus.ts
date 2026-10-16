import type { ProjectPerformance } from "@/lib/projects/performance";

export const WORKSPACE_FOCUS = [
  "attention",
  "reviews",
  "validated",
  "rated",
] as const;

export type WorkspaceFocus = (typeof WORKSPACE_FOCUS)[number];

export function parseWorkspaceFocus(value: string | undefined): WorkspaceFocus | null {
  if (!value) return null;
  return (WORKSPACE_FOCUS as readonly string[]).includes(value)
    ? (value as WorkspaceFocus)
    : null;
}

export function filterWorkspaceProjects(
  performances: ProjectPerformance[],
  focus: WorkspaceFocus | null,
): ProjectPerformance[] {
  if (!focus) return performances;
  switch (focus) {
    case "attention":
      return performances.filter((item) => item.health === "needs_attention");
    case "reviews":
      return performances.filter((item) => item.reviewCount > 0);
    case "validated":
      return performances.filter((item) => item.completedCount > 0);
    case "rated":
      return performances.filter((item) => item.ratingAverage != null);
  }
}

export function workspaceFocusTitle(focus: WorkspaceFocus | null): string {
  switch (focus) {
    case "attention":
      return "Needs attention";
    case "reviews":
      return "Projects with reviews";
    case "validated":
      return "Validated projects";
    case "rated":
      return "Rated projects";
    default:
      return "Projects";
  }
}

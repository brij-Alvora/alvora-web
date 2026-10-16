import {
  PROJECT_HEALTH_LABEL,
  type ProjectHealth,
} from "@/lib/projects/performance";
import { cn } from "@/lib/utils";

const HEALTH_STYLE: Record<
  ProjectHealth,
  { wrap: string; dot: string }
> = {
  good: {
    wrap: "bg-emerald-500/10 text-emerald-800",
    dot: "bg-emerald-600",
  },
  improving: {
    wrap: "bg-amber-500/15 text-amber-800",
    dot: "bg-amber-500",
  },
  needs_attention: {
    wrap: "bg-red-500/10 text-red-800",
    dot: "bg-red-600",
  },
};

export function ProjectHealthBadge({ health }: { health: ProjectHealth }) {
  const style = HEALTH_STYLE[health];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        style.wrap,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {PROJECT_HEALTH_LABEL[health]}
    </span>
  );
}

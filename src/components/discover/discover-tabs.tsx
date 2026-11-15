import Link from "next/link";

import type { DiscoverTab } from "@/lib/discover/presentation";
import { cn } from "@/lib/utils";

type DiscoverTabsProps = {
  active: DiscoverTab;
  mentorCount: number;
  projectCount: number;
  query?: string;
};

function tabHref(tab: DiscoverTab, query?: string) {
  const params = new URLSearchParams();
  if (tab !== "mentors") params.set("tab", tab);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/discover?${search}` : "/discover";
}

export function DiscoverTabs({
  active,
  mentorCount,
  projectCount,
  query,
}: DiscoverTabsProps) {
  const tabs: Array<{ id: DiscoverTab; label: string; count: number }> = [
    { id: "mentors", label: "Mentors", count: mentorCount },
    { id: "projects", label: "Projects", count: projectCount },
  ];

  return (
    <nav
      aria-label="Discover"
      className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tabHref(tab.id, query)}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <span className="tabular-nums text-xs text-muted-foreground">
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

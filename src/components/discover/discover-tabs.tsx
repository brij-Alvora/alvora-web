"use client";

import type { DiscoverTab } from "@/lib/discover/presentation";
import { cn } from "@/lib/utils";

type DiscoverTabsProps = {
  active: DiscoverTab;
  mentorCount: number;
  projectCount: number;
  onChange: (tab: DiscoverTab) => void;
};

export function DiscoverTabs({
  active,
  mentorCount,
  projectCount,
  onChange,
}: DiscoverTabsProps) {
  const tabs: Array<{ id: DiscoverTab; label: string; count: number }> = [
    { id: "projects", label: "Projects", count: projectCount },
    { id: "mentors", label: "Mentors", count: mentorCount },
  ];

  return (
    <nav
      aria-label="Discover"
      className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-full gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:min-w-0">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}

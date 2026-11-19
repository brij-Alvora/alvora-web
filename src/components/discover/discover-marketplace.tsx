"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";

import { DiscoverMentors } from "@/components/discover/discover-mentors";
import { DiscoverProjectProofCard } from "@/components/discover/discover-project-proof-card";
import { DiscoverTabs } from "@/components/discover/discover-tabs";
import { Input } from "@/components/ui/input";
import {
  filterMentors,
  filterProjects,
  sortMentors,
  sortProjects,
} from "@/lib/discover/filters";
import {
  MENTOR_EXPERTISE_FILTERS,
  MENTOR_SORT_OPTIONS,
  PROJECT_CATEGORY_FILTERS,
  PROJECT_SORT_OPTIONS,
  type DiscoverTab,
  type MentorSort,
  type ProjectSort,
} from "@/lib/discover/presentation";
import type { DiscoverMentor, DiscoverProjectProof } from "@/lib/discover/queries";
import { cn } from "@/lib/utils";

type DiscoverMarketplaceProps = {
  signedIn: boolean;
  initialTab: DiscoverTab;
  initialQuery: string;
  initialCategory: string;
  initialExpertise: string;
  initialProjectSort: ProjectSort;
  initialMentorSort: MentorSort;
  projects: DiscoverProjectProof[];
  mentors: DiscoverMentor[];
};

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function DiscoverMarketplace({
  signedIn,
  initialTab,
  initialQuery,
  initialCategory,
  initialExpertise,
  initialProjectSort,
  initialMentorSort,
  projects,
  mentors,
}: DiscoverMarketplaceProps) {
  const [tab, setTab] = useState<DiscoverTab>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [expertise, setExpertise] = useState(initialExpertise);
  const [projectSort, setProjectSort] = useState<ProjectSort>(initialProjectSort);
  const [mentorSort, setMentorSort] = useState<MentorSort>(initialMentorSort);
  const [, startTransition] = useTransition();

  const syncUrl = useCallback(
    (next: {
      tab?: DiscoverTab;
      q?: string;
      category?: string;
      expertise?: string;
      sort?: string;
    }) => {
      const params = new URLSearchParams();
      const nextTab = next.tab ?? tab;
      const nextQuery = next.q ?? query;
      const nextCategory = next.category ?? category;
      const nextExpertise = next.expertise ?? expertise;
      const nextSort = next.sort ?? (nextTab === "mentors" ? mentorSort : projectSort);
      if (nextTab !== "projects") params.set("tab", nextTab);
      if (nextQuery) params.set("q", nextQuery);
      if (nextTab === "projects" && nextCategory) params.set("category", nextCategory);
      if (nextTab === "mentors" && nextExpertise) params.set("expertise", nextExpertise);
      if (nextSort) params.set("sort", nextSort);
      const search = params.toString();
      window.history.replaceState(null, "", search ? `/discover?${search}` : "/discover");
    },
    [tab, query, category, expertise, mentorSort, projectSort],
  );

  const visibleProjects = useMemo(
    () => sortProjects(filterProjects(projects, query, category), projectSort),
    [projects, query, category, projectSort],
  );
  const visibleMentors = useMemo(
    () => sortMentors(filterMentors(mentors, query, expertise), mentorSort),
    [mentors, query, expertise, mentorSort],
  );

  return (
    <div className="space-y-5">
      <form
        className="sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-4"
        onSubmit={(event) => event.preventDefault()}
        role="search"
      >
        <label htmlFor="discover-search" className="sr-only">
          Search projects and mentors
        </label>
        <Input
          id="discover-search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            startTransition(() => syncUrl({ q: value }));
          }}
          placeholder="Search projects, builders, mentors, companies, skills"
        />
      </form>

      <DiscoverTabs
        active={tab}
        projectCount={visibleProjects.length}
        mentorCount={visibleMentors.length}
        onChange={(next) => {
          setTab(next);
          syncUrl({ tab: next });
        }}
      />

      {tab === "projects" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip
              active={!category}
              onClick={() => {
                setCategory("");
                syncUrl({ category: "" });
              }}
            >
              All
            </Chip>
            {PROJECT_CATEGORY_FILTERS.map((item) => (
              <Chip
                key={item}
                active={category === item}
                onClick={() => {
                  const next = category === item ? "" : item;
                  setCategory(next);
                  syncUrl({ category: next });
                }}
              >
                {item}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PROJECT_SORT_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                active={projectSort === item.id}
                onClick={() => {
                  setProjectSort(item.id);
                  syncUrl({ sort: item.id });
                }}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip
              active={!expertise}
              onClick={() => {
                setExpertise("");
                syncUrl({ expertise: "" });
              }}
            >
              All
            </Chip>
            {MENTOR_EXPERTISE_FILTERS.map((item) => (
              <Chip
                key={item}
                active={expertise === item}
                onClick={() => {
                  const next = expertise === item ? "" : item;
                  setExpertise(next);
                  syncUrl({ expertise: next });
                }}
              >
                {item}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {MENTOR_SORT_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                active={mentorSort === item.id}
                onClick={() => {
                  setMentorSort(item.id);
                  syncUrl({ sort: item.id });
                }}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {tab === "mentors" ? (
        <section className="space-y-3" aria-labelledby="mentors-heading">
          <div>
            <h2 id="mentors-heading" className="text-lg font-semibold tracking-tight">
              Mentors
            </h2>
            <p className="text-sm text-muted-foreground">
              Mentors are reviewers whose written judgment on published work
              carries public weight. Founding Mentors are marked separately.
            </p>
          </div>
          <DiscoverMentors
            mentors={visibleMentors}
            emptyMessage={
              query || expertise
                ? "No mentors match this search."
                : "Mentors appear here after they write a visible review or are recognized as Founding Mentors."
            }
          />
        </section>
      ) : (
        <section className="space-y-3" aria-labelledby="projects-heading">
          <div>
            <h2 id="projects-heading" className="text-lg font-semibold tracking-tight">
              Projects
            </h2>
            <p className="text-sm text-muted-foreground">
              Published work with review counts, scores, and the builders behind them.
            </p>
          </div>
          {visibleProjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              {query || category
                ? "No published projects match this search."
                : "Published projects appear here once builders ship work."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleProjects.map((project) => (
                <DiscoverProjectProofCard
                  key={project.id}
                  project={project}
                  signedIn={signedIn}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "mentors" && mentors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/founding-mentors" className="font-medium underline underline-offset-4">
            Become a Founding Mentor
          </Link>
        </p>
      ) : null}
    </div>
  );
}

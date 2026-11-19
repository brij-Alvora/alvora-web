import { matchesQuery } from "@/lib/admin/params";
import {
  MENTOR_EXPERTISE_FILTERS,
  PROJECT_CATEGORY_FILTERS,
  type MentorSort,
  type ProjectSort,
} from "@/lib/discover/presentation";
import type { DiscoverMentor, DiscoverProjectProof } from "@/lib/discover/queries";

function personLabel(profile: DiscoverMentor["profile"] | DiscoverProjectProof["builder"]) {
  if (!profile) return "Builder";
  const name = profile.full_name?.trim();
  if (name) return name;
  return `@${profile.username}`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const CATEGORY_ALIASES: Record<(typeof PROJECT_CATEGORY_FILTERS)[number], string[]> = {
  AI: ["ai", "artificial intelligence", "llm", "machine learning", "ml"],
  SaaS: ["saas", "software as a service"],
  "Developer Tools": ["developer tools", "devtools", "developer tool", "dev tools"],
  Productivity: ["productivity"],
  Education: ["education", "edtech"],
  Healthcare: ["healthcare", "health", "healthtech"],
  Fintech: ["fintech", "finance"],
};

const EXPERTISE_ALIASES: Record<(typeof MENTOR_EXPERTISE_FILTERS)[number], string[]> = {
  Product: ["product", "pm", "product management", "product manager"],
  Engineering: ["engineering", "engineer", "software", "fullstack", "backend", "frontend"],
  Design: ["design", "designer", "ux", "ui"],
  Marketing: ["marketing", "growth", "go to market"],
  Founder: ["founder", "cofounder", "co founder", "ceo"],
  AI: ["ai", "llm", "machine learning", "ml", "artificial intelligence"],
};

function haystackForProject(project: DiscoverProjectProof) {
  return [
    project.title,
    project.short_description,
    project.category,
    ...project.tags,
    project.builder?.username,
    personLabel(project.builder),
    project.builder?.headline,
    project.reviewerName,
    project.reviewSummary,
  ]
    .filter(Boolean)
    .join(" ");
}

function haystackForMentor(mentor: DiscoverMentor) {
  return [
    mentor.profile.username,
    mentor.profile.full_name,
    mentor.profile.headline,
    ...mentor.profile.expertise,
    ...mentor.reviewedProjects.map((project) => project.title),
  ]
    .filter(Boolean)
    .join(" ");
}

export function projectMatchesCategory(
  project: DiscoverProjectProof,
  category: string,
) {
  if (!category) return true;
  const key = PROJECT_CATEGORY_FILTERS.find((item) => item === category);
  if (!key) {
    return normalize(project.category ?? "") === normalize(category);
  }
  const tokens = CATEGORY_ALIASES[key];
  const fields = [project.category ?? "", ...project.tags].map(normalize);
  return fields.some((field) =>
    tokens.some((token) => field === token || field.includes(token)),
  );
}

export function mentorMatchesExpertise(mentor: DiscoverMentor, expertise: string) {
  if (!expertise) return true;
  const key = MENTOR_EXPERTISE_FILTERS.find((item) => item === expertise);
  const tokens = key ? EXPERTISE_ALIASES[key] : [normalize(expertise)];
  const fields = [
    ...mentor.profile.expertise,
    mentor.profile.headline ?? "",
    mentor.profile.mentor_statement ?? "",
  ].map(normalize);
  return fields.some((field) =>
    tokens.some((token) => field === token || field.includes(token)),
  );
}

function recencyScore(iso: string | null | undefined) {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  const days = Math.max(0, (Date.now() - then) / 86_400_000);
  return Math.max(0, 30 - days);
}

export function filterProjects(
  projects: DiscoverProjectProof[],
  query: string,
  category: string,
) {
  return projects.filter(
    (project) =>
      matchesQuery(haystackForProject(project), query) &&
      projectMatchesCategory(project, category),
  );
}

export function sortProjects(projects: DiscoverProjectProof[], sort: ProjectSort) {
  const copy = [...projects];
  copy.sort((a, b) => {
    if (sort === "newest") {
      return (b.published_at || b.created_at).localeCompare(
        a.published_at || a.created_at,
      );
    }
    if (sort === "highest_rated") {
      return (b.averageRating ?? -1) - (a.averageRating ?? -1);
    }
    if (sort === "most_reviewed") {
      return b.reviewCount - a.reviewCount;
    }
    const trendA = a.reviewCount * 4 + recencyScore(a.published_at || a.created_at);
    const trendB = b.reviewCount * 4 + recencyScore(b.published_at || b.created_at);
    return trendB - trendA;
  });
  return copy;
}

export function filterMentors(
  mentors: DiscoverMentor[],
  query: string,
  expertise: string,
) {
  return mentors.filter(
    (mentor) =>
      matchesQuery(haystackForMentor(mentor), query) &&
      mentorMatchesExpertise(mentor, expertise),
  );
}

export function sortMentors(mentors: DiscoverMentor[], sort: MentorSort) {
  const copy = [...mentors];
  copy.sort((a, b) => {
    if (sort === "founding") {
      const founding =
        Number(b.profile.is_founding_mentor) - Number(a.profile.is_founding_mentor);
      if (founding !== 0) return founding;
      return b.reviewsGiven - a.reviewsGiven;
    }
    if (sort === "newest") {
      return b.profile.created_at.localeCompare(a.profile.created_at);
    }
    if (sort === "highest_rated") {
      return (b.averageRating ?? -1) - (a.averageRating ?? -1);
    }
    return (
      b.reviewsGiven - a.reviewsGiven ||
      Number(b.profile.is_founding_mentor) - Number(a.profile.is_founding_mentor)
    );
  });
  return copy;
}

/**
 * Public-catalog quality rules. Client-safe: no server/DB imports.
 * Used to keep Discover and homepage Trending free of QA inventory.
 */

export const TRENDING_MIN_QUALITY = {
  minReviewedProjects: 3,
  minMentorsWithReviews: 3,
  minReviews: 6,
} as const;

export const FOUNDING_SHOWCASE_MIN_REVIEWS = 1;

const PLACEHOLDER_DISPLAY_NAMES = new Set([
  "builder",
  "builder a",
  "builder b",
  "builder c",
  "test user",
  "test user 2",
  "validator a",
  "validator b",
  "alvora reviewer",
]);

const PLACEHOLDER_USERNAMES = new Set([
  "e2e",
  "playwright",
  "cypress",
  "test",
  "testuser",
  "test-user",
  "test_user",
  "alvora-reviewer",
  "alvorareviewer",
  "validator-a",
  "validator_a",
  "builder-a",
  "builder_a",
]);

const PLACEHOLDER_PROJECT_TITLES = new Set([
  "status lock verification",
]);

export function normalizeCatalogText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function looksLikeQaLabel(value: string) {
  const n = normalizeCatalogText(value);
  if (!n) return false;
  if (PLACEHOLDER_DISPLAY_NAMES.has(n)) return true;
  if (PLACEHOLDER_USERNAMES.has(n.replace(/\s/g, ""))) return true;
  if (
    /^(test|demo|dummy|fake|sample|e2e|playwright|cypress|seed)( |$)/.test(n)
  ) {
    return true;
  }
  if (/\b(e2e|playwright|cypress|test user|dummy user|seed data)\b/.test(n)) {
    return true;
  }
  if (/\b(builder|validator|reviewer)\s+[a-z]\b/.test(n)) return true;
  return false;
}

export function isPlaceholderPerson(input: {
  username?: string | null;
  full_name?: string | null;
} | null | undefined) {
  if (!input) return false;
  if (input.username && looksLikeQaLabel(input.username)) return true;
  if (input.full_name && looksLikeQaLabel(input.full_name)) return true;
  return false;
}

export function isPlaceholderProject(input: {
  title: string;
  slug: string;
  builder?: { username?: string | null; full_name?: string | null } | null;
}) {
  const title = normalizeCatalogText(input.title);
  const slug = normalizeCatalogText(input.slug);
  if (PLACEHOLDER_PROJECT_TITLES.has(title)) return true;
  if (looksLikeQaLabel(input.title) || looksLikeQaLabel(input.slug)) return true;
  if (/\b(status lock|e2e|playwright|cypress)\b/.test(`${title} ${slug}`)) {
    return true;
  }
  if (isPlaceholderPerson(input.builder)) return true;
  return false;
}

type DedupeProject = {
  id: string;
  slug: string;
  title: string;
  owner_id: string;
  reviewCount: number;
  published_at: string | null;
  created_at: string;
};

function projectRank(project: DedupeProject) {
  return [
    project.reviewCount,
    project.published_at || project.created_at,
    project.id,
  ] as const;
}

function isBetterProject(next: DedupeProject, current: DedupeProject) {
  const a = projectRank(next);
  const b = projectRank(current);
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  return a[2] < b[2];
}

export function dedupeProjects<T extends DedupeProject>(projects: T[]): T[] {
  const bySlug = new Map<string, T>();
  for (const project of projects) {
    const key = normalizeCatalogText(project.slug) || project.id;
    const existing = bySlug.get(key);
    if (!existing || isBetterProject(project, existing)) {
      bySlug.set(key, project);
    }
  }

  const byOwnerTitle = new Map<string, T>();
  for (const project of bySlug.values()) {
    const key = `${project.owner_id}:${normalizeCatalogText(project.title)}`;
    const existing = byOwnerTitle.get(key);
    if (!existing || isBetterProject(project, existing)) {
      byOwnerTitle.set(key, project);
    }
  }
  return [...byOwnerTitle.values()];
}

type DedupeMentor = {
  reviewsGiven: number;
  profile: {
    id: string;
    user_id: string | null;
    username: string;
    is_founding_mentor: boolean;
  };
};

function isBetterMentor(next: DedupeMentor, current: DedupeMentor) {
  if (next.profile.is_founding_mentor !== current.profile.is_founding_mentor) {
    return next.profile.is_founding_mentor;
  }
  if (next.reviewsGiven !== current.reviewsGiven) {
    return next.reviewsGiven > current.reviewsGiven;
  }
  return next.profile.id < current.profile.id;
}

export function dedupeMentors<T extends DedupeMentor>(mentors: T[]): T[] {
  const byUsername = new Map<string, T>();
  for (const mentor of mentors) {
    const key = mentor.profile.username.toLowerCase();
    const existing = byUsername.get(key);
    if (!existing || isBetterMentor(mentor, existing)) {
      byUsername.set(key, mentor);
    }
  }

  const byAuth = new Map<string, T>();
  for (const mentor of byUsername.values()) {
    const key = mentor.profile.user_id || mentor.profile.id;
    const existing = byAuth.get(key);
    if (!existing || isBetterMentor(mentor, existing)) {
      byAuth.set(key, mentor);
    }
  }
  return [...byAuth.values()];
}

export function meetsFoundingShowcaseBar(mentor: {
  reviewsGiven: number;
  profile: { is_founding_mentor: boolean };
}) {
  return (
    mentor.profile.is_founding_mentor &&
    mentor.reviewsGiven >= FOUNDING_SHOWCASE_MIN_REVIEWS
  );
}

export type TrendingQualityInput = {
  projects: Array<{ reviewCount: number }>;
  mentors: Array<{ reviewsGiven: number }>;
};

export type TrendingQualityThreshold = {
  minReviewedProjects: number;
  minMentorsWithReviews: number;
  minReviews: number;
};

export function catalogMeetsTrendingQuality(
  catalog: TrendingQualityInput,
  threshold: TrendingQualityThreshold = TRENDING_MIN_QUALITY,
) {
  const reviewedProjects = catalog.projects.filter(
    (project) => project.reviewCount > 0,
  ).length;
  const mentorsWithReviews = catalog.mentors.filter(
    (mentor) => mentor.reviewsGiven > 0,
  ).length;
  const reviews = catalog.projects.reduce(
    (total, project) => total + project.reviewCount,
    0,
  );
  return (
    reviewedProjects >= threshold.minReviewedProjects &&
    mentorsWithReviews >= threshold.minMentorsWithReviews &&
    reviews >= threshold.minReviews
  );
}

export function thumbnailMonogram(title: string) {
  const words = title
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function thumbnailPaletteIndex(seed: string, modulo = 5) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

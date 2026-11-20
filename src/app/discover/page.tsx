import { DiscoverFeaturedCarousel } from "@/components/discover/discover-featured-carousel";
import { DiscoverFoundingShowcase } from "@/components/discover/discover-founding-showcase";
import { DiscoverHero } from "@/components/discover/discover-hero";
import { DiscoverMarketplace } from "@/components/discover/discover-marketplace";
import { DiscoverRecentReviews } from "@/components/discover/discover-recent-reviews";
import { firstParam, type SearchValues } from "@/lib/admin/params";
import {
  parseDiscoverTab,
  parseMentorSort,
  parseProjectSort,
} from "@/lib/discover/presentation";
import { getPublicDiscoverCatalog } from "@/lib/discover/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover · Alvora",
  description:
    "Public proof for AI builders. Browse shipped work with named written reviews from reviewers, mentors, and Founding Mentors.",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function DiscoverPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const q = firstParam(params, "q");
  const tab = parseDiscoverTab(firstParam(params, "tab"));
  const category = firstParam(params, "category");
  const expertise = firstParam(params, "expertise");
  const sortValue = firstParam(params, "sort");
  const catalog = await getPublicDiscoverCatalog();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <DiscoverHero stats={catalog.stats} signedIn={Boolean(user)} />
      <DiscoverFeaturedCarousel projects={catalog.featured} />
      <div id="projects" className="scroll-mt-24">
        <DiscoverMarketplace
          signedIn={Boolean(user)}
          currentUserId={user?.id ?? null}
          initialTab={tab}
          initialQuery={q}
          initialCategory={category}
          initialExpertise={expertise}
          initialProjectSort={parseProjectSort(sortValue)}
          initialMentorSort={parseMentorSort(sortValue)}
          projects={catalog.projects}
          mentors={catalog.mentors}
        />
      </div>
      <DiscoverRecentReviews reviews={catalog.recentReviews} />
      <DiscoverFoundingShowcase mentors={catalog.foundingShowcase} />
    </div>
  );
}

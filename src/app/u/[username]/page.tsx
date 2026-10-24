import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import { getMentorContributionMap } from "@/lib/mentors/contributions";
import { getCurrentProfile, getProfileByUsername } from "@/lib/profile/queries";
import { getPublishedProjectsByOwner } from "@/lib/project/queries";
import { calculateReputation } from "@/lib/reputation/calculator";
import type { DiscoverProject } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { title: "Profile not found · Alvora" };
  }

  return {
    title: `${profile.full_name ?? profile.username} · Alvora`,
    description:
      profile.headline ??
      profile.bio ??
      `Public builder profile for @${profile.username}`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const ownerId = profile.user_id ?? profile.id;
  const [reputation, published, current, contributions] = await Promise.all([
    calculateReputation(ownerId),
    getPublishedProjectsByOwner(ownerId),
    getCurrentProfile(),
    profile.is_founding_mentor
      ? getMentorContributionMap([profile])
      : Promise.resolve(null),
  ]);

  const projects: DiscoverProject[] = published.map((project) => ({
    ...project,
    builder: profile,
  }));
  const isOwner =
    current?.id === profile.id ||
    current?.user_id === ownerId ||
    current?.id === ownerId;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <ProfileView
        profile={profile}
        reputation={reputation}
        projects={projects}
        contributions={contributions?.get(profile.id) ?? null}
        isOwner={Boolean(isOwner)}
      />
    </div>
  );
}

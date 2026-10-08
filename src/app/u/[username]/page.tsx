import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import { getProfileByUsername } from "@/lib/actions/profile";

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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <ProfileView profile={profile} />
    </div>
  );
}

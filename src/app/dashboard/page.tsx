import { redirect } from "next/navigation";

import { BuilderHome } from "@/components/dashboard/builder-home";
import { getBuilderStats } from "@/lib/dashboard/stats";
import { getCurrentProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Builder Home · Alvora",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const stats = getBuilderStats(profile);

  return (
    <BuilderHome
      email={user.email ?? ""}
      profile={profile}
      stats={stats}
    />
  );
}

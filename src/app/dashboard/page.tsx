import { redirect } from "next/navigation";

import { BuilderHome } from "@/components/dashboard/builder-home";
import { getBuilderStats } from "@/lib/dashboard/stats";
import { getMyProjects } from "@/lib/project/queries";
import { getCurrentProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { getMyValidationRequests } from "@/lib/validation/queries";

export const dynamic = "force-dynamic";

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
  const [stats, projects, validationRequests] = await Promise.all([
    getBuilderStats(profile, user.id),
    getMyProjects(),
    getMyValidationRequests(),
  ]);

  return (
    <BuilderHome
      email={user.email ?? ""}
      profile={profile}
      stats={stats}
      projects={projects}
      validationRequests={validationRequests.slice(0, 5)}
    />
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Dashboard · Alvora",
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
  const isComplete = Boolean(
    profile?.full_name && profile?.username && profile?.headline,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>
              {isComplete
                ? "Your builder identity is ready to share."
                : "Complete your profile to publish your public page."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/profile/edit">
                {profile ? "Edit profile" : "Create profile"}
              </Link>
            </Button>
            {profile?.username ? (
              <Button asChild variant="outline">
                <Link href={`/u/${profile.username}`}>View public page</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage credentials and session for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Email: {user.email}</p>
            <p>User ID: {user.id}</p>
            {profile?.username ? <p>Username: @{profile.username}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

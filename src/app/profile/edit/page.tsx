import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { getCurrentProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Edit profile · Alvora",
};

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-tight">
          {profile ? "Edit profile" : "Create profile"}
        </h1>
        <p className="text-muted-foreground">
          This information appears on your public Alvora page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Builder identity</CardTitle>
          <CardDescription>
            Name, headline, bio, location, and professional links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}

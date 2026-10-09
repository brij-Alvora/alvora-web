import { redirect } from "next/navigation";

import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { hasProfileValue } from "@/lib/profile/presentation";
import { getCurrentProfile } from "@/lib/profile/queries";
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
  const displayName = hasProfileValue(profile?.full_name)
    ? profile.full_name
    : hasProfileValue(profile?.username)
      ? profile.username
      : (user.email?.split("@")[0] ?? "Builder");

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
          <CardTitle>Photo</CardTitle>
          <CardDescription>
            Upload a square image. It appears on your dashboard and public profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader profile={profile} displayName={displayName} />
        </CardContent>
      </Card>

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

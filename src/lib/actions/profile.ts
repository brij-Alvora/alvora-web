"use server";

import { revalidatePath } from "next/cache";

import { mapProfile } from "@/lib/profile/map-profile";
import {
  getCurrentProfile as queryCurrentProfile,
  getProfileByUsername as queryProfileByUsername,
} from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import {
  normalizeProfileValues,
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";

export type ProfileActionResult = {
  error?: string;
  success?: string;
  profile?: Profile;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  return queryCurrentProfile();
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  return queryProfileByUsername(username);
}

export async function upsertProfileAction(
  input: ProfileFormValues,
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile" };
  }

  const normalized = normalizeProfileValues(parsed.data);
  const existing = await queryCurrentProfile();

  const { data: taken } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("username", normalized.username)
    .maybeSingle();

  if (
    taken &&
    taken.id !== existing?.id &&
    taken.user_id !== user.id &&
    taken.id !== user.id
  ) {
    return { error: "That username is already taken" };
  }

  const payload = {
    username: normalized.username,
    full_name: normalized.full_name,
    headline: normalized.headline,
    bio: normalized.bio,
    location: normalized.location,
    website: normalized.website,
    github_url: normalized.github_url,
    linkedin_url: normalized.linkedin_url,
    updated_at: new Date().toISOString(),
  };

  let saved: Record<string, unknown> | null = null;
  let errorMessage: string | undefined;

  if (existing) {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    saved = (data ?? null) as Record<string, unknown> | null;
    errorMessage = error?.message;
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        user_id: user.id,
        ...payload,
      })
      .select("*")
      .single();

    saved = (data ?? null) as Record<string, unknown> | null;
    errorMessage = error?.message;
  }

  if (errorMessage || !saved) {
    return { error: errorMessage ?? "Could not save profile" };
  }

  const profile = mapProfile(saved);
  if (!profile) {
    return { error: "Profile saved but could not be read back" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/edit");
  revalidatePath(`/u/${profile.username}`);
  if (existing?.username && existing.username !== profile.username) {
    revalidatePath(`/u/${existing.username}`);
  }

  return { success: "Profile saved", profile };
}

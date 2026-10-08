"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeProfileValues,
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";
import type { Profile } from "@/lib/supabase/types";

export type ProfileActionResult = {
  error?: string;
  success?: string;
  profile?: Profile;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  return data;
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

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized.username)
    .neq("id", user.id)
    .maybeSingle();

  if (taken) {
    return { error: "That username is already taken" };
  }

  const payload = {
    id: user.id,
    ...normalized,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/edit");
  revalidatePath(`/u/${data.username}`);

  return { success: "Profile saved", profile: data };
}

"use server";

import { revalidatePath } from "next/cache";

import { mapProfile } from "@/lib/profile/map-profile";
import { getCurrentProfile as queryCurrentProfile } from "@/lib/profile/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_BUCKET,
  avatarExtensionForMime,
  isAllowedAvatarMime,
  validateAvatarFile,
} from "@/lib/validations/avatar";
import type { Profile } from "@/lib/supabase/types";

export type AvatarActionResult = {
  error?: string;
  success?: string;
  profile?: Profile;
};

function usernameFromEmail(email: string | undefined, userId: string): string {
  const local = email?.split("@")[0]?.toLowerCase() ?? "user";
  const cleaned = local.replace(/[^a-z0-9_]/g, "_").slice(0, 24);
  const base = cleaned.length >= 3 ? cleaned : "user";
  return `${base}_${userId.replace(/-/g, "").slice(0, 6)}`;
}

export async function uploadAvatarAction(
  formData: FormData,
): Promise<AvatarActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload" };
  }

  const validationError = validateAvatarFile(file);
  if (validationError || !isAllowedAvatarMime(file.type)) {
    return { error: validationError ?? "Use a JPG, PNG, or WEBP image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your avatar" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Server storage credentials are missing.",
    };
  }

  const path = `${user.id}/avatar.${avatarExtensionForMime(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = admin.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const existing = await queryCurrentProfile();
  const timestamp = new Date().toISOString();
  const payload = {
    avatar_url: avatarUrl,
    updated_at: timestamp,
  };

  let saved: Record<string, unknown> | null = null;
  let errorMessage: string | undefined;

  if (existing) {
    const matchColumn = existing.user_id ? "user_id" : "id";
    const matchValue = existing.user_id ? user.id : existing.id;

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq(matchColumn, matchValue)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      const { data: adminData, error: adminError } = await admin
        .from("profiles")
        .update(payload)
        .eq(matchColumn, matchValue)
        .select("*")
        .maybeSingle();

      saved = (adminData ?? null) as Record<string, unknown> | null;
      errorMessage = adminError?.message ?? error?.message;
    } else {
      saved = data as Record<string, unknown>;
    }
  } else {
    const insertPayload = {
      id: user.id,
      user_id: user.id,
      username: usernameFromEmail(user.email, user.id),
      ...payload,
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      const { data: adminData, error: adminError } = await admin
        .from("profiles")
        .insert(insertPayload)
        .select("*")
        .single();

      saved = (adminData ?? null) as Record<string, unknown> | null;
      errorMessage = adminError?.message ?? error?.message;
    } else {
      saved = data as Record<string, unknown>;
    }
  }

  if (errorMessage || !saved) {
    return { error: errorMessage ?? "Could not save avatar" };
  }

  const profile = mapProfile(saved);
  if (!profile) {
    return { error: "Avatar uploaded but profile could not be read back" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/edit");
  revalidatePath(`/u/${profile.username}`);

  return { success: "Avatar saved", profile };
}

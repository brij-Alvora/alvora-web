import { createClient } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/profile/map-profile";
import type { Profile } from "@/lib/supabase/types";

async function fetchProfileWhere(
  match: { user_id: string } | { id: string } | { username: string },
): Promise<Profile | null> {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*");

  if ("user_id" in match) {
    query = query.eq("user_id", match.user_id);
  } else if ("username" in match) {
    query = query.eq("username", match.username);
  } else {
    query = query.eq("id", match.id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return null;
  }

  return mapProfile((data ?? null) as Record<string, unknown> | null);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const byUserId = await fetchProfileWhere({ user_id: user.id });
  if (byUserId) return byUserId;

  return fetchProfileWhere({ id: user.id });
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  return fetchProfileWhere({ username: username.toLowerCase() });
}

export async function getProfileByAuthId(
  userId: string,
): Promise<Profile | null> {
  const byUserId = await fetchProfileWhere({ user_id: userId });
  if (byUserId) return byUserId;
  return fetchProfileWhere({ id: userId });
}

export async function getProfilesByAuthIds(
  userIds: string[],
): Promise<Map<string, Profile>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  const byAuthId = new Map<string, Profile>();
  if (ids.length === 0) return byAuthId;

  const supabase = await createClient();
  const [{ data: byUserId }, { data: byId }] = await Promise.all([
    supabase.from("profiles").select("*").in("user_id", ids),
    supabase.from("profiles").select("*").in("id", ids),
  ]);

  for (const row of [...(byUserId ?? []), ...(byId ?? [])]) {
    const profile = mapProfile(row as Record<string, unknown>);
    if (!profile) continue;
    if (profile.user_id) byAuthId.set(profile.user_id, profile);
    byAuthId.set(profile.id, profile);
  }

  return byAuthId;
}

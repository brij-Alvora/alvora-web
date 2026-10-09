import { mapProject } from "@/lib/project/map-project";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/supabase/types";

function mapRows(data: unknown): Project[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapProject(row as Record<string, unknown>))
    .filter((row): row is Project => row !== null);
}

export async function getMyProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return mapRows(data);
}

export async function getProjectByIdForOwner(
  id: string,
): Promise<Project | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) return null;
  return mapProject((data ?? null) as Record<string, unknown> | null);
}

export async function getPublishedProjectBySlug(
  slug: string,
): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .eq("status", "published")
    .maybeSingle();

  if (error) return null;
  return mapProject((data ?? null) as Record<string, unknown> | null);
}

export async function countOwnerProjects(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (error || count == null) return 0;
  return count;
}

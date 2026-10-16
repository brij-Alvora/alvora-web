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

export async function getAccessibleProject(
  id: string,
): Promise<Project | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  const project = mapProject((data ?? null) as Record<string, unknown> | null);
  if (!project) return null;

  const isOwner = user?.id === project.owner_id;
  const isPublished = project.status === "published";
  if (!isOwner && !isPublished) return null;
  return project;
}

export async function getPublishedProjectsByOwner(
  ownerId: string,
): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return mapRows(data);
}

export async function getRecentPublishedProjects(
  limit = 8,
): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return mapRows(data);
}

export async function getProjectsByIds(ids: string[]): Promise<Project[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .in("id", unique);
  if (error || !data) return [];
  return mapRows(data).filter(
    (project) =>
      project.status === "published" || project.owner_id === user?.id,
  );
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

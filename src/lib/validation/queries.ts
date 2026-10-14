import { mapProject } from "@/lib/project/map-project";
import { createClient } from "@/lib/supabase/server";
import type { Project, ValidationRequest } from "@/lib/supabase/types";
import { mapValidationRequest } from "@/lib/validation/map-request";

export type ValidationRequestWithProject = ValidationRequest & {
  project: Pick<Project, "id" | "title" | "slug" | "owner_id" | "status"> | null;
};

async function attachProjects(
  requests: ValidationRequest[],
): Promise<ValidationRequestWithProject[]> {
  if (requests.length === 0) return [];

  const supabase = await createClient();
  const ids = [...new Set(requests.map((request) => request.project_id))];
  const { data } = await supabase.from("projects").select("*").in("id", ids);

  const projectsById = new Map<string, Project>();
  for (const row of data ?? []) {
    const project = mapProject(row as Record<string, unknown>);
    if (project) projectsById.set(project.id, project);
  }

  return requests.map((request) => {
    const project = projectsById.get(request.project_id) ?? null;
    return {
      ...request,
      project: project
        ? {
            id: project.id,
            title: project.title,
            slug: project.slug,
            owner_id: project.owner_id,
            status: project.status,
          }
        : null,
    };
  });
}

function mapRows(data: unknown): ValidationRequest[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapValidationRequest(row as Record<string, unknown>))
    .filter((row): row is ValidationRequest => row !== null);
}

export async function getMyValidationRequests(): Promise<
  ValidationRequestWithProject[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("requested_by", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return attachProjects(mapRows(data));
}

export async function getValidationRequestsOnMyProjects(): Promise<
  ValidationRequestWithProject[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: owned } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", user.id);
  const ids = (owned ?? []).map((row) => row.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("validation_requests")
    .select("*")
    .in("project_id", ids)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return attachProjects(mapRows(data));
}

export async function getOpenValidationRequests(
  limit = 8,
): Promise<ValidationRequestWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return attachProjects(mapRows(data));
}

export async function getValidationRequestsByIds(
  ids: string[],
): Promise<ValidationRequest[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("validation_requests")
    .select("*")
    .in("id", unique);
  if (error || !data) return [];
  return mapRows(data);
}

export async function getReviewableValidationRequests(): Promise<
  ValidationRequestWithProject[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("validation_requests")
    .select("*")
    .neq("requested_by", user.id)
    .in("status", ["open", "in_review"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return attachProjects(mapRows(data));
}

export async function getValidationRequestById(
  id: string,
): Promise<ValidationRequestWithProject | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("validation_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const request = mapValidationRequest(data as Record<string, unknown>);
  if (!request) return null;

  const [attached] = await attachProjects([request]);
  return attached ?? null;
}

export async function countMyValidationRequests(
  userId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("validation_requests")
    .select("id", { count: "exact", head: true })
    .eq("requested_by", userId);

  if (error || count == null) return 0;
  return count;
}

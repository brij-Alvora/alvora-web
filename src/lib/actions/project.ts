"use server";

import { revalidatePath } from "next/cache";

import { mapProject } from "@/lib/project/map-project";
import { slugifyTitle, uniqueSlug } from "@/lib/project/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import { AVATAR_BUCKET } from "@/lib/validations/avatar";
import {
  isAllowedAvatarMime,
  validateAvatarFile,
} from "@/lib/validations/avatar";
import {
  normalizeProjectValues,
  projectSchema,
} from "@/lib/validations/project";

export type ProjectActionResult = {
  error?: string;
  success?: string;
  project?: Project;
};

async function revalidateProjectSurfaces(project: Project) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}/edit`);
  revalidatePath(`/project/${project.slug}`);
}

async function allocateSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const supabase = await createClient();
  const base = slugifyTitle(title);
  let candidate = base;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let query = supabase
      .from("projects")
      .select("id")
      .eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = uniqueSlug(base, crypto.randomUUID());
  }
  return uniqueSlug(base, crypto.randomUUID());
}

async function uploadThumbnail(
  userId: string,
  projectId: string,
  file: File,
): Promise<string> {
  const admin = createAdminClient();
  const extension = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
      ? "webp"
      : "jpg";
  const path = `${userId}/projects/${projectId}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    upsert: true,
    contentType: file.type || "image/jpeg",
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function saveProjectAction(
  formData: FormData,
): Promise<ProjectActionResult> {
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    short_description: formData.get("short_description") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    tags: formData.get("tags") ?? "",
    github_url: formData.get("github_url") ?? "",
    demo_url: formData.get("demo_url") ?? "",
    status: formData.get("status") ?? "draft",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const file = formData.get("thumbnail");
  if (file instanceof File && file.size > 0) {
    const fileError = validateAvatarFile(file);
    if (fileError || !isAllowedAvatarMime(file.type)) {
      return { error: fileError ?? "Use a JPG, PNG, or WEBP thumbnail." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to save a project" };

  const existingId = String(formData.get("id") ?? "");
  const values = normalizeProjectValues(parsed.data);
  const timestamp = new Date().toISOString();
  const publishedAt =
    values.status === "published" ? timestamp : null;

  const fields = {
    title: values.title,
    short_description: values.short_description,
    description: values.description,
    category: values.category,
    tags: values.tags,
    github_url: values.github_url,
    demo_url: values.demo_url,
    status: values.status,
    published_at: publishedAt,
    updated_at: timestamp,
  };

  let saved: Record<string, unknown> | null = null;
  let errorMessage: string | undefined;

  if (existingId) {
    const { data, error } = await supabase
      .from("projects")
      .update(fields)
      .eq("id", existingId)
      .eq("owner_id", user.id)
      .select("*")
      .maybeSingle();
    saved = (data ?? null) as Record<string, unknown> | null;
    errorMessage = error?.message;
    if (!saved && !errorMessage) {
      try {
        const admin = createAdminClient();
        const { data: adminData, error: adminError } = await admin
          .from("projects")
          .update(fields)
          .eq("id", existingId)
          .eq("owner_id", user.id)
          .select("*")
          .maybeSingle();
        saved = (adminData ?? null) as Record<string, unknown> | null;
        errorMessage = adminError?.message;
      } catch (adminError) {
        errorMessage =
          adminError instanceof Error ? adminError.message : errorMessage;
      }
    }
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...fields,
        owner_id: user.id,
        slug: await allocateSlug(values.title),
      })
      .select("*")
      .single();
    saved = (data ?? null) as Record<string, unknown> | null;
    errorMessage = error?.message;
    if (!saved) {
      try {
        const admin = createAdminClient();
        const { data: adminData, error: adminError } = await admin
          .from("projects")
          .insert({
            ...fields,
            owner_id: user.id,
            slug: await allocateSlug(values.title),
          })
          .select("*")
          .single();
        saved = (adminData ?? null) as Record<string, unknown> | null;
        errorMessage = adminError?.message;
      } catch (adminError) {
        errorMessage =
          adminError instanceof Error ? adminError.message : errorMessage;
      }
    }
  }

  let project = mapProject(saved);
  if (!project) {
    return { error: errorMessage ?? "Could not save project" };
  }

  if (file instanceof File && file.size > 0) {
    try {
      const thumbnailUrl = await uploadThumbnail(user.id, project.id, file);
      const { data } = await supabase
        .from("projects")
        .update({ thumbnail_url: thumbnailUrl, updated_at: timestamp })
        .eq("id", project.id)
        .eq("owner_id", user.id)
        .select("*")
        .maybeSingle();
      const mapped = mapProject((data ?? null) as Record<string, unknown> | null);
      if (mapped) project = mapped;
      else project = { ...project, thumbnail_url: thumbnailUrl };
    } catch (uploadError) {
      return {
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "Project saved but thumbnail upload failed",
        project,
      };
    }
  }

  await revalidateProjectSurfaces(project);
  return {
    success:
      project.status === "published" ? "Project published" : "Draft saved",
    project,
  };
}

export async function setProjectStatusAction(
  projectId: string,
  status: ProjectStatus,
): Promise<ProjectActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { data, error } = await supabase
    .from("projects")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();

  const project = mapProject((data ?? null) as Record<string, unknown> | null);
  if (!project) return { error: error?.message ?? "Could not update status" };

  await revalidateProjectSurfaces(project);
  return { success: `Project ${status}`, project };
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ProjectActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { data: existing } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  const project = mapProject(
    (existing ?? null) as Record<string, unknown> | null,
  );

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (project) revalidatePath(`/project/${project.slug}`);
  return { success: "Project deleted", project: project ?? undefined };
}

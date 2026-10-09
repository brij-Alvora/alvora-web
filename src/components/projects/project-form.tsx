"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { saveProjectAction } from "@/lib/actions/project";
import type { Project } from "@/lib/supabase/types";
import { validateAvatarFile } from "@/lib/validations/avatar";
import {
  PROJECT_CATEGORIES,
  projectSchema,
  type ProjectFormValues,
} from "@/lib/validations/project";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectThumbnail } from "@/components/projects/project-thumbnail";

type ProjectFormProps = {
  project?: Project | null;
};

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    project?.thumbnail_url ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      short_description: project?.short_description ?? "",
      description: project?.description ?? "",
      category: (project?.category as ProjectFormValues["category"]) ?? "",
      tags: project?.tags.join(", ") ?? "",
      github_url: project?.github_url ?? "",
      demo_url: project?.demo_url ?? "",
      status: project?.status ?? "draft",
    },
  });

  const onPickThumbnail = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    const fileError = validateAvatarFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const submit = (status: ProjectFormValues["status"]) =>
    handleSubmit((values) => {
      setError(null);
      setSuccess(null);
      setValue("status", status);
      startTransition(async () => {
        const formData = new FormData();
        if (project?.id) formData.set("id", project.id);
        formData.set("title", values.title);
        formData.set("short_description", values.short_description ?? "");
        formData.set("description", values.description ?? "");
        formData.set("category", values.category ?? "");
        formData.set("tags", values.tags ?? "");
        formData.set("github_url", values.github_url ?? "");
        formData.set("demo_url", values.demo_url ?? "");
        formData.set("status", status);
        if (thumbnailFile) formData.set("thumbnail", thumbnailFile);

        const result = await saveProjectAction(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess(result.success ?? "Saved");
        if (result.project && !project?.id) {
          router.replace(`/projects/${result.project.id}/edit`);
        }
        router.refresh();
      });
    })();

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_description">Short description</Label>
        <Input
          id="short_description"
          placeholder="One line for cards and listings"
          {...register("short_description")}
        />
        {errors.short_description ? (
          <p className="text-sm text-destructive">
            {errors.short_description.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed description</Label>
        <Textarea
          id="description"
          placeholder="What it does, who it's for, and how it was built."
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("category")}
          >
            <option value="">Select a category</option>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="ai, nextjs, supabase"
            {...register("tags")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL</Label>
          <Input id="github_url" type="url" {...register("github_url")} />
          {errors.github_url ? (
            <p className="text-sm text-destructive">
              {errors.github_url.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo_url">Demo URL</Label>
          <Input id="demo_url" type="url" {...register("demo_url")} />
          {errors.demo_url ? (
            <p className="text-sm text-destructive">{errors.demo_url.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail</Label>
        <ProjectThumbnail
          src={thumbnailPreview}
          alt="Project thumbnail preview"
          variant="preview"
        />
        <Input
          id="thumbnail"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => onPickThumbnail(event.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WEBP. Max 5 MB. Preview appears before save.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => submit("draft")}
        >
          {isPending ? "Saving..." : "Save draft"}
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => submit("published")}
        >
          {isPending ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}

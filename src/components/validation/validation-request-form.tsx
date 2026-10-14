"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createValidationRequestAction } from "@/lib/actions/validation";
import type { Project } from "@/lib/supabase/types";
import {
  VALIDATION_TYPE_LABELS,
  VALIDATION_TYPES,
  validationRequestSchema,
  type ValidationRequestFormValues,
} from "@/lib/validations/validation-request";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ValidationRequestFormProps = {
  projects: Project[];
  defaultProjectId?: string;
};

export function ValidationRequestForm({
  projects,
  defaultProjectId,
}: ValidationRequestFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationRequestFormValues>({
    resolver: zodResolver(validationRequestSchema),
    defaultValues: {
      project_id: defaultProjectId ?? projects[0]?.id ?? "",
      validation_type: "product_validation",
      request_title: "",
      request_text: "",
    },
  });

  const onSubmit = (values: ValidationRequestFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await createValidationRequestAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.request) {
        router.push(`/validations/${result.request.id}`);
        router.refresh();
      }
    });
  };

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create or publish a project before requesting validation.{" "}
        <Link href="/projects/new" className="font-medium underline underline-offset-4">
          Create a project
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="project_id">Project</Label>
        <select
          id="project_id"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("project_id")}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
              {project.status !== "published" ? " (draft)" : ""}
            </option>
          ))}
        </select>
        {errors.project_id ? (
          <p className="text-sm text-destructive">{errors.project_id.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="validation_type">Validation type</Label>
        <select
          id="validation_type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("validation_type")}
        >
          {VALIDATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {VALIDATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.validation_type ? (
          <p className="text-sm text-destructive">
            {errors.validation_type.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="request_title">Request title</Label>
        <Input id="request_title" {...register("request_title")} />
        {errors.request_title ? (
          <p className="text-sm text-destructive">
            {errors.request_title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="request_text">Request description</Label>
        <Textarea
          id="request_text"
          placeholder="What should reviewers look at, and what decision do you need?"
          {...register("request_text")}
        />
        {errors.request_text ? (
          <p className="text-sm text-destructive">
            {errors.request_text.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Create request"}
      </Button>
    </form>
  );
}

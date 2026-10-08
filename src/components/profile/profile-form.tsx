"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { upsertProfileAction } from "@/lib/actions/profile";
import type { Profile } from "@/lib/supabase/types";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormProps = {
  profile: Profile | null;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username ?? "",
      full_name: profile?.full_name ?? "",
      headline: profile?.headline ?? "",
      bio: profile?.bio ?? "",
      location: profile?.location ?? "",
      website: profile?.website ?? "",
      github_url: profile?.github_url ?? "",
      linkedin_url: profile?.linkedin_url ?? "",
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await upsertProfileAction(values);
      if (result.error) setError(result.error);
      if (result.success) setSuccess(result.success);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Name</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-sm text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...register("username")} />
          {errors.username && (
            <p className="text-sm text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          placeholder="AI builder · Product engineer"
          {...register("headline")}
        />
        {errors.headline && (
          <p className="text-sm text-destructive">{errors.headline.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="What you build, why you build it."
          {...register("bio")}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="City, Country"
          {...register("location")}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://"
            {...register("website")}
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL</Label>
          <Input
            id="github_url"
            type="url"
            placeholder="https://github.com/you"
            {...register("github_url")}
          />
          {errors.github_url && (
            <p className="text-sm text-destructive">
              {errors.github_url.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
        <Input
          id="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/you"
          {...register("linkedin_url")}
        />
        {errors.linkedin_url && (
          <p className="text-sm text-destructive">
            {errors.linkedin_url.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

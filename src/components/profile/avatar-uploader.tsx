"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { uploadAvatarAction } from "@/lib/actions/avatar";
import type { Profile } from "@/lib/supabase/types";
import { getInitials } from "@/lib/utils";
import { validateAvatarFile } from "@/lib/validations/avatar";
import { hasProfileValue } from "@/lib/profile/presentation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type AvatarUploaderProps = {
  profile: Profile | null;
  displayName: string;
};

export function AvatarUploader({ profile, displayName }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [savedUrl, setSavedUrl] = useState(profile?.avatar_url ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownUrl = previewUrl ?? savedUrl;
  const hasUnsavedPreview = Boolean(selectedFile && previewUrl);

  const onPickFile = (file: File | undefined) => {
    setError(null);
    setSuccess(null);

    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSave = () => {
    if (!selectedFile) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const result = await uploadAvatarAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSavedUrl(result.profile?.avatar_url ?? savedUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccess(result.success ?? "Avatar saved");
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar className="h-24 w-24 border border-border">
        {hasProfileValue(shownUrl) ? (
          <AvatarImage src={shownUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-sm text-muted-foreground">
            JPG, PNG, or WEBP. Max 5 MB. Preview before you save.
          </p>
        </div>

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

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(event) => onPickFile(event.target.files?.[0])}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            {savedUrl || hasUnsavedPreview ? "Replace photo" : "Choose photo"}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!hasUnsavedPreview || isPending}
          >
            {isPending ? "Saving..." : "Save photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

const EXTENSION_BY_MIME: Record<AvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedAvatarMime(type: string): type is AvatarMimeType {
  if (type === "image/jpg") return true;
  return (AVATAR_MIME_TYPES as readonly string[]).includes(type);
}

export function avatarExtensionForMime(type: string): string {
  if (type === "image/jpg" || type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export function validateAvatarFile(file: File): string | null {
  if (!isAllowedAvatarMime(file.type)) {
    return "Use a JPG, PNG, or WEBP image.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

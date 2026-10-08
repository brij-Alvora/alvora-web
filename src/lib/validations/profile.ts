import { z } from "zod";

const optionalString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be under ${max} characters`)
    .optional()
    .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || URL.canParse(value),
    "Enter a valid URL",
  );

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username may only contain lowercase letters, numbers, and underscores",
    ),
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  headline: optionalString(120, "Headline"),
  bio: optionalString(1000, "Bio"),
  location: optionalString(100, "Location"),
  website: optionalUrl,
  github_url: optionalUrl,
  linkedin_url: optionalUrl,
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export function normalizeProfileValues(values: ProfileFormValues) {
  const blankToNull = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  return {
    username: values.username,
    full_name: values.full_name,
    headline: blankToNull(values.headline),
    bio: blankToNull(values.bio),
    location: blankToNull(values.location),
    website: blankToNull(values.website),
    github_url: blankToNull(values.github_url),
    linkedin_url: blankToNull(values.linkedin_url),
  };
}

import { z } from "zod";

export const PROJECT_CATEGORIES = [
  "AI",
  "Developer Tools",
  "Productivity",
  "SaaS",
  "Open Source",
  "Other",
] as const;

export const PROJECT_STATUSES = ["draft", "published", "archived"] as const;

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
  .refine((value) => !value || URL.canParse(value), "Enter a valid URL");

export const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(80, "Title must be under 80 characters"),
  short_description: optionalString(160, "Short description"),
  description: optionalString(4000, "Detailed description"),
  category: z.enum(PROJECT_CATEGORIES).optional().or(z.literal("")),
  tags: optionalString(200, "Tags"),
  github_url: optionalUrl,
  demo_url: optionalUrl,
  status: z.enum(PROJECT_STATUSES),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export function parseTagInput(value?: string): string[] {
  if (!value?.trim()) return [];
  const unique = new Set(
    value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8),
  );
  return [...unique];
}

export function normalizeProjectValues(values: ProjectFormValues) {
  const blankToNull = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  return {
    title: values.title.trim(),
    short_description: blankToNull(values.short_description),
    description: blankToNull(values.description),
    category: blankToNull(values.category),
    tags: parseTagInput(values.tags),
    github_url: blankToNull(values.github_url),
    demo_url: blankToNull(values.demo_url),
    status: values.status,
  };
}

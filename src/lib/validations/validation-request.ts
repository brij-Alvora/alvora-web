import { z } from "zod";

export const VALIDATION_TYPES = [
  "product_validation",
  "ux_validation",
  "technical_review",
  "idea_validation",
  "ai_agent_validation",
] as const;

export const VALIDATION_TYPE_LABELS: Record<
  (typeof VALIDATION_TYPES)[number],
  string
> = {
  product_validation: "Product Validation",
  ux_validation: "UX Validation",
  technical_review: "Technical Review",
  idea_validation: "Idea Validation",
  ai_agent_validation: "AI Agent Validation",
};

export const VALIDATION_STATUSES = ["open", "in_review", "completed"] as const;

export const VALIDATION_STATUS_LABELS: Record<
  (typeof VALIDATION_STATUSES)[number],
  string
> = {
  open: "Open",
  in_review: "In Review",
  completed: "Completed",
};

export const validationRequestSchema = z.object({
  project_id: z.string().uuid("Select a project"),
  validation_type: z.enum(VALIDATION_TYPES),
  request_title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters"),
  request_text: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(4000, "Description must be under 4000 characters"),
});

export type ValidationRequestFormValues = z.infer<
  typeof validationRequestSchema
>;

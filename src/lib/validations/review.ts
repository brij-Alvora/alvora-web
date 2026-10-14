import { z } from "zod";

export const reviewSchema = z.object({
  validation_request_id: z.string().uuid(),
  rating: z
    .number({ error: "Choose a rating from 1 to 5" })
    .int()
    .min(1, "Choose a rating from 1 to 5")
    .max(5, "Choose a rating from 1 to 5"),
  what_works_well: z
    .string()
    .trim()
    .min(10, "Describe what works well (at least 10 characters)")
    .max(2000, "Keep this under 2000 characters"),
  improvement_areas: z
    .string()
    .trim()
    .min(10, "Describe improvement areas (at least 10 characters)")
    .max(2000, "Keep this under 2000 characters"),
  recommendations: z
    .string()
    .trim()
    .min(10, "Add recommendations (at least 10 characters)")
    .max(2000, "Keep this under 2000 characters"),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

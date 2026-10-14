import { z } from "zod";

import { REPORT_REASONS, REPORT_TARGET_TYPES } from "@/lib/reports/types";

export const reportSchema = z.object({
  target_type: z.enum(REPORT_TARGET_TYPES),
  target_id: z.string().trim().min(1, "Missing target"),
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(2000, "Keep this under 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

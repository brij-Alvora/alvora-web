import { z } from "zod";

import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/lib/support/types";

export const supportTicketSchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES),
  priority: z.enum(SUPPORT_PRIORITIES),
  subject: z
    .string()
    .trim()
    .min(4, "Subject must be at least 4 characters")
    .max(120, "Keep the subject under 120 characters"),
  message: z
    .string()
    .trim()
    .min(20, "Describe the issue in at least 20 characters")
    .max(4000, "Keep this under 4000 characters"),
});

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

export const supportReplySchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Reply must be at least 10 characters")
    .max(4000, "Keep this under 4000 characters"),
});

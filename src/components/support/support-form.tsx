"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupportTicketAction } from "@/lib/actions/support";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITIES,
  SUPPORT_PRIORITY_LABELS,
} from "@/lib/support/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SupportForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        startTransition(async () => {
          setError(null);
          const result = await createSupportTicketAction({
            category: form.get("category"),
            priority: form.get("priority"),
            subject: form.get("subject"),
            message: form.get("message"),
          });
          if (result.error) {
            setError(result.error);
            return;
          }
          formElement.reset();
          if (result.ticket) {
            router.push(`/support/${result.ticket.id}`);
            return;
          }
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SUPPORT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {SUPPORT_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          required
          defaultValue="medium"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SUPPORT_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {SUPPORT_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required maxLength={120} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required minLength={20} rows={6} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Create ticket"}
      </Button>
    </form>
  );
}

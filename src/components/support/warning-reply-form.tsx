"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { replyToAccountWarningAction } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type WarningReplyFormProps = {
  warningMessage: string;
};

export function WarningReplyForm({ warningMessage }: WarningReplyFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await replyToAccountWarningAction(
            warningMessage,
            message,
          );
          if (result.error) {
            setError(result.error);
            return;
          }
          if (result.ticket) {
            router.push(`/support/${result.ticket.id}`);
            return;
          }
          router.refresh();
        });
      }}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="warning-reply">Reply to this warning</Label>
        <Textarea
          id="warning-reply"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Explain the situation or ask Support a question."
          minLength={10}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send to Support"}
      </Button>
    </form>
  );
}

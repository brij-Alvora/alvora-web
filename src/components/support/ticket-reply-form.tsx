"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { replyToSupportTicketAction } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TicketReplyFormProps = {
  ticketId: string;
  closed?: boolean;
};

export function TicketReplyForm({ ticketId, closed }: TicketReplyFormProps) {
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
          const result = await replyToSupportTicketAction(ticketId, message);
          if (result.error) {
            setError(result.error);
            return;
          }
          setMessage("");
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
        <Label htmlFor="ticket-reply">
          {closed ? "Reply to reopen this ticket" : "Reply"}
        </Label>
        <Textarea
          id="ticket-reply"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add details or ask a follow-up question."
          minLength={10}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : closed ? "Reply and reopen" : "Send reply"}
      </Button>
    </form>
  );
}

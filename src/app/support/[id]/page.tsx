import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { formatDiscoverDate } from "@/lib/discover/format";
import { getMySupportTicketById } from "@/lib/support/queries";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/lib/support/types";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Support ticket · Alvora",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupportTicketPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/support");

  const { id } = await params;
  const ticket = await getMySupportTicketById(user.id, id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {SUPPORT_CATEGORY_LABELS[ticket.category]} ·{" "}
              {SUPPORT_PRIORITY_LABELS[ticket.priority]} ·{" "}
              {SUPPORT_STATUS_LABELS[ticket.status]}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {ticket.subject}
            </h1>
            <p className="text-xs text-muted-foreground">
              Created At {formatDiscoverDate(ticket.created_at)}
              {ticket.first_response_at
                ? ` · First Response At ${formatDiscoverDate(ticket.first_response_at)}`
                : ""}
              {ticket.closed_at
                ? ` · Closed At ${formatDiscoverDate(ticket.closed_at)}`
                : ""}
            </p>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6">{ticket.message}</p>
          {ticket.admin_reply ? (
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Support reply
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.admin_reply}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No reply yet. We will update this ticket when a teammate responds.
            </p>
          )}
        </CardContent>
      </Card>
      <Link
        href="/support"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to support
      </Link>
    </div>
  );
}

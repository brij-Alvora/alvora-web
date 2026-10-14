import Link from "next/link";
import { redirect } from "next/navigation";

import { firstParam, type SearchValues } from "@/lib/admin/params";
import { SupportForm } from "@/components/support/support-form";
import { formatDiscoverDate } from "@/lib/discover/format";
import { getMySupportTickets } from "@/lib/support/queries";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/lib/support/types";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Support · Alvora",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function SupportPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/support");

  const params = await searchParams;
  const restricted = firstParam(params, "restricted") === "1";
  const tickets = await getMySupportTickets(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support Center</h1>
        <p className="text-sm text-muted-foreground">
          Open a ticket for account, project, validation, review, bugs, or
          features.
        </p>
        {restricted ? (
          <p className="mt-2 text-sm text-destructive">
            This account is suspended and cannot create projects or reviews.
            You can still contact Support.
          </p>
        ) : null}
      </div>
      <Card className="shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <SupportForm />
        </CardContent>
      </Card>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your tickets</h2>
        {tickets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No tickets yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link href={`/support/${ticket.id}`}>
                  <Card className="shadow-sm transition-colors hover:bg-accent/40">
                    <CardContent className="p-4">
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {SUPPORT_CATEGORY_LABELS[ticket.category]} ·{" "}
                        {SUPPORT_PRIORITY_LABELS[ticket.priority]} ·{" "}
                        {SUPPORT_STATUS_LABELS[ticket.status]} ·{" "}
                        {formatDiscoverDate(ticket.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

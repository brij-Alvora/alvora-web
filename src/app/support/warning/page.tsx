import Link from "next/link";
import { redirect } from "next/navigation";

import { WarningReplyForm } from "@/components/support/warning-reply-form";
import { formatDiscoverDate } from "@/lib/discover/format";
import { getMyNotifications } from "@/lib/notifications/queries";
import { getCurrentProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Account warning · Alvora",
};

export const dynamic = "force-dynamic";

export default async function AccountWarningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/support/warning");

  const [profile, notifications] = await Promise.all([
    getCurrentProfile(),
    getMyNotifications(user.id),
  ]);
  const warning = notifications.find((item) => item.type === "account_warned");
  const status = profile?.account_status ?? "active";
  const message =
    warning?.message ??
    (status === "warned"
      ? "A moderator issued a warning on your account. Please follow community guidelines."
      : "There is no active warning on this account.");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Account · {status}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Account warning
        </h1>
        {warning ? (
          <p className="text-xs text-muted-foreground">
            {formatDiscoverDate(warning.created_at)}
          </p>
        ) : null}
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Moderator message
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6">{message}</p>
        </CardContent>
      </Card>

      {status === "warned" || warning ? (
        <Card className="shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <WarningReplyForm warningMessage={message} />
          </CardContent>
        </Card>
      ) : null}

      <Link
        href="/support"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        Back to support
      </Link>
    </div>
  );
}

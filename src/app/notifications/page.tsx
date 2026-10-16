import Link from "next/link";
import { redirect } from "next/navigation";

import { NotificationActions } from "@/components/notifications/notification-actions";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { formatDiscoverDate } from "@/lib/discover/format";
import { notificationHref } from "@/lib/notifications/href";
import {
  getMyNotifications,
  unreadCount,
} from "@/lib/notifications/queries";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications/types";
import { isNotificationUnread } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Notifications · Alvora",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function NotificationsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const { view } = await searchParams;
  const items = await getMyNotifications(user.id);
  const unread = unreadCount(items);
  const visible =
    view === "unread"
      ? items.filter(isNotificationUnread)
      : view === "history"
        ? items.filter((item) => !isNotificationUnread(item))
        : items;

  const tabs = [
    { id: "all", label: "All", href: "/notifications", count: items.length },
    {
      id: "unread",
      label: "Unread",
      href: "/notifications?view=unread",
      count: unread,
    },
    {
      id: "history",
      label: "History",
      href: "/notifications?view=history",
      count: items.length - unread,
    },
  ] as const;

  const active = view === "unread" || view === "history" ? view : "all";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            {unread} unread · {items.length} total
          </p>
        </div>
        {unread > 0 ? <NotificationActions /> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              active === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {tab.label} {tab.count}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          {active === "unread"
            ? "You’re all caught up."
            : "No notifications yet. Reviews, validations, and reputation updates will appear here."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id}>
              <Card
                className={
                  isNotificationUnread(item)
                    ? "border-primary/30 shadow-sm"
                    : "shadow-sm"
                }
              >
                <CardContent className="flex gap-3 p-4">
                  <NotificationIcon type={item.type} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      {NOTIFICATION_TYPE_LABELS[item.type]}
                    </p>
                    <p className="font-medium">{item.title}</p>
                    {item.message ? (
                      <p className="text-sm text-muted-foreground">
                        {item.message}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {formatDiscoverDate(item.created_at)}
                    </p>
                    <NotificationActions
                      id={item.id}
                      href={notificationHref(item)}
                      unread={isNotificationUnread(item)}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

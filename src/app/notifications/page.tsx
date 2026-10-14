import { redirect } from "next/navigation";

import { NotificationActions } from "@/components/notifications/notification-actions";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { formatDiscoverDate } from "@/lib/discover/format";
import { notificationHref } from "@/lib/notifications/href";
import {
  getMyNotifications,
  unreadCount,
} from "@/lib/notifications/queries";
import { isNotificationUnread } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Notifications · Alvora",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const items = await getMyNotifications(user.id);
  const unread = unreadCount(items);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Historical activity log · {unread} unread · {items.length} total
          </p>
        </div>
        {unread > 0 ? <NotificationActions /> : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No notifications yet. Reviews, validations, reputation events, and
          support ticket activity remain here after they are resolved.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
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

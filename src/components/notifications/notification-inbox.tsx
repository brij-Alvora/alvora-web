"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { formatDiscoverDate } from "@/lib/discover/format";
import { notificationHref } from "@/lib/notifications/href";
import { mapNotification } from "@/lib/notifications/map-notification";
import { isNotificationUnread } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/supabase/types";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationInboxProps = {
  userId: string;
  initialUnread: number;
  initialItems: AppNotification[];
};

export function NotificationInbox({
  userId,
  initialUnread,
  initialItems,
}: NotificationInboxProps) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setUnread(initialUnread);
    setItems(initialItems);
  }, [initialUnread, initialItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = mapNotification(
            (payload.new ?? null) as Record<string, unknown> | null,
          );
          if (payload.eventType === "INSERT" && next) {
            setItems((current) =>
              [next, ...current.filter((item) => item.id !== next.id)].slice(
                0,
                8,
              ),
            );
            if (isNotificationUnread(next)) {
              setUnread((count) => count + 1);
            }
          }
          if (payload.eventType === "UPDATE" && next) {
            setItems((current) =>
              current.map((item) => (item.id === next.id ? next : item)),
            );
            const previous = mapNotification(
              (payload.old ?? null) as Record<string, unknown> | null,
            );
            const wasUnread = previous ? isNotificationUnread(previous) : true;
            const nowUnread = isNotificationUnread(next);
            if (wasUnread && !nowUnread) {
              setUnread((count) => Math.max(0, count - 1));
            }
          }
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  const preview = useMemo(() => items.slice(0, 6), [items]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative shrink-0 px-2"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await markAllNotificationsReadAction();
                  setUnread(0);
                  setItems((current) =>
                    current.map((item) => ({
                      ...item,
                      is_read: true,
                      read_at: item.read_at ?? new Date().toISOString(),
                    })),
                  );
                  router.refresh();
                });
              }}
            >
              Mark all read
            </button>
          ) : null}
        </div>
        {preview.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul>
            {preview.map((item) => (
              <li key={item.id}>
                <DropdownMenuItem asChild className="items-start gap-2 p-3">
                  <Link
                    href={notificationHref(item)}
                    onClick={() => {
                      if (isNotificationUnread(item)) {
                        startTransition(async () => {
                          await markNotificationReadAction(item.id);
                        });
                      }
                    }}
                  >
                    <NotificationIcon type={item.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-5">
                        {item.title}
                      </span>
                      {item.message ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {item.message}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {formatDiscoverDate(item.created_at).slice(0, 10)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/notifications">Open notification center</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

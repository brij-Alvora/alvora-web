"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

type NotificationActionsProps = {
  id?: string;
  href?: string | null;
  unread?: boolean;
};

export function NotificationActions({
  id,
  href,
  unread,
}: NotificationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!id) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await markAllNotificationsReadAction();
            router.refresh();
          });
        }}
      >
        {isPending ? "Updating..." : "Mark all read"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {href ? (
        <Button asChild size="sm">
          <Link
            href={href}
            onClick={() => {
              if (unread) {
                startTransition(async () => {
                  await markNotificationReadAction(id);
                });
              }
            }}
          >
            Open
          </Link>
        </Button>
      ) : null}
      {unread ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await markNotificationReadAction(id);
              router.refresh();
            });
          }}
        >
          Mark read
        </Button>
      ) : null}
    </div>
  );
}

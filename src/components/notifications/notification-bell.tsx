import { Bell } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type NotificationBellProps = {
  unread: number;
};

export function NotificationBell({ unread }: NotificationBellProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="relative shrink-0 px-2"
    >
      <Link
        href="/notifications"
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
      </Link>
    </Button>
  );
}

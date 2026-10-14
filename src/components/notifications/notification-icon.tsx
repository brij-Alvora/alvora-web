import {
  BadgeCheck,
  CheckCircle2,
  MessageSquare,
  Rocket,
  ShieldAlert,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { NotificationType } from "@/lib/notifications/types";

const ICONS: Record<NotificationType, LucideIcon> = {
  review_received: Star,
  validation_completed: BadgeCheck,
  reputation_level_up: Trophy,
  project_published: Rocket,
  support_ticket_updated: MessageSquare,
  support_ticket_resolved: CheckCircle2,
  account_warned: ShieldAlert,
};

export function NotificationIcon({ type }: { type: NotificationType }) {
  const Icon = ICONS[type];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

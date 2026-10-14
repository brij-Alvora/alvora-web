import Link from "next/link";

import type { AdminCounts } from "@/lib/admin/queries";
import { Card, CardContent } from "@/components/ui/card";

const CARDS: {
  key: keyof AdminCounts;
  label: string;
  href: string;
}[] = [
  { key: "users", label: "Total users", href: "/admin/users" },
  { key: "projects", label: "Projects", href: "/admin/projects" },
  { key: "validationRequests", label: "Validation requests", href: "/admin/validations" },
  { key: "reviews", label: "Reviews", href: "/admin/reviews" },
  { key: "reputationEvents", label: "Reputation events", href: "/admin/events" },
];

export function AdminStatGrid({ counts }: { counts: AdminCounts }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {CARDS.map((item) => (
        <Link key={item.key} href={item.href} className="block">
          <Card className="h-full shadow-sm transition-colors hover:bg-accent/40">
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                {counts[item.key]}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

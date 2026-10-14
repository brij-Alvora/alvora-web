import Link from "next/link";

import { formatDiscoverDateTime } from "@/lib/discover/format";
import type { DiscoverActivityItem } from "@/lib/discover/queries";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverActivityProps = {
  items: DiscoverActivityItem[];
};

export function DiscoverActivity({ items }: DiscoverActivityProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No platform activity yet.
      </p>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <ol className="divide-y divide-border">
          {items.map((item) => {
            const content = (
              <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatDiscoverDateTime(item.createdAt)}
                </p>
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="block hover:bg-accent/40">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

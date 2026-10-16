import Link from "next/link";

import { formatDiscoverDate } from "@/lib/discover/format";
import type { WorkspaceFeedItem } from "@/lib/projects/performance";
import { Card, CardContent } from "@/components/ui/card";

export function WorkspaceFeed({ items }: { items: WorkspaceFeedItem[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Recent feedback</h2>
        <p className="text-sm text-muted-foreground">
          Reviews and completed validations on your projects.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Feedback will appear here after someone reviews your work.
        </p>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border p-0">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">
                    {item.kind === "review" ? "Review" : "Validation"}
                  </p>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDiscoverDate(item.createdAt).slice(0, 10)}
                  </p>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

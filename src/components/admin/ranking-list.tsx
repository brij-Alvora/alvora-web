import Link from "next/link";

import type { RankedCount } from "@/lib/admin/queries";
import { Card, CardContent } from "@/components/ui/card";

type RankingListProps = {
  title: string;
  items: RankedCount[];
  emptyLabel?: string;
  unit?: string;
  hrefFor?: (item: RankedCount) => string | null;
};

export function RankingList({
  title,
  items,
  emptyLabel = "No data.",
  unit = "",
  hrefFor,
}: RankingListProps) {
  const max = items[0]?.value ?? 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5">
        <h3 className="font-medium">{title}</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, index) => {
              const width = max > 0 ? Math.round((item.value / max) * 100) : 0;
              const href = hrefFor?.(item) ?? null;
              const row = (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="mr-2 tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                      {item.label}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {item.value}
                      {unit}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-secondary"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </>
              );
              return (
                <li key={item.label} className="space-y-1.5">
                  {href ? (
                    <Link href={href} className="block rounded-md hover:bg-accent/40">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

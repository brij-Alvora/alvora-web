import Link from "next/link";

import { formatDiscoverDate } from "@/lib/discover/format";
import type { ReviewContribution } from "@/lib/projects/performance";
import { Card, CardContent } from "@/components/ui/card";

export function ContributionList({
  contributions,
  href,
  detailed = false,
}: {
  contributions: ReviewContribution[];
  href?: string;
  detailed?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Reviews you’ve given
          </h2>
          <p className="text-sm text-muted-foreground">
            Your contribution to other builders’ projects.
          </p>
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View history
          </Link>
        ) : null}
      </div>
      {contributions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          You haven’t reviewed another project yet. Open Validate to contribute.
        </p>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border p-0">
            {contributions.map((item) => {
              const destination = item.validationHref ?? item.projectHref;
              const inner = (
                <div className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">
                      {item.rating}★ · {item.projectTitle}
                    </p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatDiscoverDate(item.createdAt).slice(0, 10)}
                    </p>
                  </div>
                  {detailed ? (
                    <dl className="space-y-1 text-sm text-muted-foreground">
                      {item.strength ? (
                        <div>
                          <dt className="inline font-medium text-foreground">
                            Strengths:{" "}
                          </dt>
                          <dd className="inline">{item.strength}</dd>
                        </div>
                      ) : null}
                      {item.improvement ? (
                        <div>
                          <dt className="inline font-medium text-foreground">
                            Improvement:{" "}
                          </dt>
                          <dd className="inline">{item.improvement}</dd>
                        </div>
                      ) : null}
                      {item.recommendation ? (
                        <div>
                          <dt className="inline font-medium text-foreground">
                            Recommend:{" "}
                          </dt>
                          <dd className="inline">{item.recommendation}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : item.recommendation || item.strength ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {item.recommendation ?? item.strength}
                    </p>
                  ) : null}
                </div>
              );
              return destination ? (
                <Link
                  key={item.id}
                  href={destination}
                  className="block hover:bg-secondary/40"
                >
                  {inner}
                </Link>
              ) : (
                <div key={item.id}>{inner}</div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

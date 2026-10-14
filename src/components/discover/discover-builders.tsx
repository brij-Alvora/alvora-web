import Link from "next/link";

import { builderLabel } from "@/lib/discover/queries";
import type { DiscoverBuilder } from "@/lib/discover/queries";
import { hasProfileValue } from "@/lib/profile/presentation";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverBuildersProps = {
  builders: DiscoverBuilder[];
};

export function DiscoverBuilders({ builders }: DiscoverBuildersProps) {
  if (builders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No reputation rankings yet.
      </p>
    );
  }

  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {builders.map((builder, index) => {
        const name = builderLabel(builder.profile);
        return (
          <li key={builder.profile.id}>
            <Link href={`/u/${builder.profile.username}`} className="block">
              <Card className="shadow-sm transition-colors hover:bg-accent/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="w-6 text-sm font-medium tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <Avatar className="h-11 w-11 border border-border">
                    {hasProfileValue(builder.profile.avatar_url) ? (
                      <AvatarImage
                        src={builder.profile.avatar_url}
                        alt={name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {builder.level} · {builder.points} pts
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

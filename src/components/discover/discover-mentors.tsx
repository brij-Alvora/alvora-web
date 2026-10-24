import Link from "next/link";

import { ExpertiseList } from "@/components/mentors/expertise-list";
import { FoundingMentorBadge } from "@/components/mentors/founding-mentor-badge";
import { builderLabel, type DiscoverMentor } from "@/lib/discover/queries";
import { hasProfileValue } from "@/lib/profile/presentation";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverMentorsProps = {
  mentors: DiscoverMentor[];
  emptyMessage?: string;
};

export function DiscoverMentors({
  mentors,
  emptyMessage = "No founding mentors yet.",
}: DiscoverMentorsProps) {
  if (mentors.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {mentors.map((mentor) => {
        const name = builderLabel(mentor.profile);
        const reviewLabel =
          mentor.reviewsGiven === 1 ? "1 review given" : `${mentor.reviewsGiven} reviews given`;
        return (
          <li key={mentor.profile.id}>
            <Link href={`/u/${mentor.profile.username}`} className="block h-full">
              <Card className="h-full shadow-sm transition-colors hover:bg-accent/40">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 border border-border">
                      {hasProfileValue(mentor.profile.avatar_url) ? (
                        <AvatarImage src={mentor.profile.avatar_url} alt={name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{name}</p>
                        <FoundingMentorBadge />
                      </div>
                      {hasProfileValue(mentor.profile.headline) ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {mentor.profile.headline}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <ExpertiseList areas={mentor.profile.expertise} />
                  <p className="text-sm text-muted-foreground">
                    {mentor.level} · {mentor.points} pts · {reviewLabel}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

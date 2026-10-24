import Link from "next/link";

import { ExpertiseList } from "@/components/mentors/expertise-list";
import { FoundingMentorMark } from "@/components/mentors/founding-mentor-credential";
import { FOUNDING_MENTOR_STATEMENT } from "@/lib/mentors/copy";
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
        const statement = hasProfileValue(mentor.profile.headline)
          ? mentor.profile.headline
          : FOUNDING_MENTOR_STATEMENT;
        return (
          <li key={mentor.profile.id}>
            <Link href={`/u/${mentor.profile.username}`} className="block h-full">
              <Card className="h-full border-[#e0d0a4] bg-card shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <FoundingMentorMark />
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 border border-border">
                      {hasProfileValue(mentor.profile.avatar_url) ? (
                        <AvatarImage src={mentor.profile.avatar_url} alt={name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{name}</p>
                      <p className="text-xs font-medium text-[#8d7344]">
                        Invited expert reviewer
                      </p>
                    </div>
                  </div>
                  <ExpertiseList areas={mentor.profile.expertise} />
                  <p className="text-sm leading-6 text-muted-foreground">{statement}</p>
                  <p className="text-xs font-medium tracking-wide text-[#8d7344]">
                    Founding Cohort 2026
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

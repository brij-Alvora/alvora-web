import Link from "next/link";

import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import { MentorAuthority } from "@/components/mentors/mentor-authority";
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
        return (
          <li key={mentor.profile.id}>
            <Link href={`/u/${mentor.profile.username}`} className="block h-full">
              <Card className="h-full border-[#e0d0a4] bg-card shadow-sm">
                <CardContent className="space-y-4 p-4">
                  <FoundingMentorCredential showStatement={false} />
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-border">
                      {hasProfileValue(mentor.profile.avatar_url) ? (
                        <AvatarImage src={mentor.profile.avatar_url} alt={name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="truncate text-base font-semibold text-foreground">
                      {name}
                    </p>
                  </div>
                  <MentorAuthority
                    expertise={mentor.profile.expertise}
                    mentorStatement={mentor.profile.mentor_statement}
                    showCredential={false}
                    showQualified
                  />
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

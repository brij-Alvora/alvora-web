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
        const profileHref = `/u/${mentor.profile.username}`;
        return (
          <li key={mentor.profile.id}>
            <Card className="h-full border-[#e0d0a4] bg-card shadow-sm">
              <CardContent className="space-y-4 p-4">
                <FoundingMentorCredential showStatement={false} />
                <Link href={profileHref} className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-border">
                    {hasProfileValue(mentor.profile.avatar_url) ? (
                      <AvatarImage src={mentor.profile.avatar_url} alt={name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate text-base font-semibold text-foreground hover:underline">
                    {name}
                  </p>
                </Link>
                  <MentorAuthority
                    expertise={mentor.profile.expertise}
                    mentorStatement={mentor.profile.mentor_statement}
                    showCredential={false}
                  />
                {mentor.reviewedProjects.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Projects reviewed
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {mentor.reviewedProjects.map((project) => (
                        <li key={project.id}>
                          <Link
                            href={`/project/${project.slug}`}
                            className="text-sm font-medium text-foreground hover:underline"
                          >
                            {project.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No published reviews yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

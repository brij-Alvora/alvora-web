import Link from "next/link";

import { FoundingMentorMark } from "@/components/mentors/founding-mentor-credential";
import { formatRating } from "@/lib/discover/format";
import { builderLabel, parseHeadlineParts } from "@/lib/discover/presentation";
import type { DiscoverMentor } from "@/lib/discover/queries";
import { hasProfileValue } from "@/lib/profile/presentation";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DiscoverMentorsProps = {
  mentors: DiscoverMentor[];
  emptyMessage?: string;
  featured?: boolean;
};

export function DiscoverMentors({
  mentors,
  emptyMessage = "No mentors to show yet.",
  featured = false,
}: DiscoverMentorsProps) {
  if (mentors.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-3",
        featured ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {mentors.map((mentor) => (
        <li key={mentor.profile.id}>
          <MentorCard mentor={mentor} featured={featured} />
        </li>
      ))}
    </ul>
  );
}

function MentorCard({
  mentor,
  featured,
}: {
  mentor: DiscoverMentor;
  featured: boolean;
}) {
  const name = builderLabel(mentor.profile);
  const profileHref = `/u/${mentor.profile.username}`;
  const { title, company } = parseHeadlineParts(mentor.profile.headline);
  const rating = formatRating(mentor.averageRating);
  const founding = mentor.profile.is_founding_mentor;

  return (
    <Card
      className={cn(
        "h-full shadow-sm transition-shadow hover:shadow-md",
        founding && "border-[#e0d0a4] bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_42%)]",
        featured && "p-0",
      )}
    >
      <CardContent className={cn("space-y-4", featured ? "p-5" : "p-4")}>
        {founding ? <FoundingMentorMark /> : (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reviewer
          </p>
        )}
        <Link href={profileHref} className="flex items-center gap-3">
          <Avatar className={cn("border border-border", featured ? "h-14 w-14" : "h-11 w-11")}>
            {hasProfileValue(mentor.profile.avatar_url) ? (
              <AvatarImage src={mentor.profile.avatar_url} alt={name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground hover:underline">
              {name}
            </p>
            {title ? (
              <p className="truncate text-sm text-muted-foreground">{title}</p>
            ) : null}
            {company ? (
              <p className="truncate text-xs text-muted-foreground">{company}</p>
            ) : null}
          </div>
        </Link>
        {mentor.profile.expertise.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {mentor.profile.expertise.slice(0, 5).map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline">Reviews </dt>
            <dd className="inline tabular-nums text-foreground">{mentor.reviewsGiven}</dd>
          </div>
          <div>
            <dt className="inline">Avg. rating </dt>
            <dd className="inline tabular-nums text-foreground">{rating ?? "—"}</dd>
          </div>
        </dl>
        <Button asChild size="sm" variant="outline">
          <Link href={profileHref}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

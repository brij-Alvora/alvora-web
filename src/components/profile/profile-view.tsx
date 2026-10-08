import { Code2, ExternalLink, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import type { Profile } from "@/lib/supabase/types";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type ProfileViewProps = {
  profile: Profile;
};

export function ProfileView({ profile }: ProfileViewProps) {
  const links = [
    profile.website
      ? { href: profile.website, label: "Website", icon: Globe }
      : null,
    profile.github_url
      ? { href: profile.github_url, label: "GitHub", icon: Code2 }
      : null,
    profile.linkedin_url
      ? {
          href: profile.linkedin_url,
          label: "LinkedIn",
          icon: ExternalLink,
        }
      : null,
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: LucideIcon;
  }[];

  return (
    <article className="mx-auto w-full max-w-2xl space-y-8">
      <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 border border-border">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {getInitials(profile.full_name ?? profile.username)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            {profile.full_name ?? profile.username}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.headline ? (
            <p className="pt-1 text-base text-foreground/80">{profile.headline}</p>
          ) : null}
          {profile.location ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </p>
          ) : null}
        </div>
      </header>

      {profile.bio ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              About
            </h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
              {profile.bio}
            </p>
          </section>
        </>
      ) : null}

      {links.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Links
            </h2>
            <ul className="flex flex-wrap gap-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </article>
  );
}

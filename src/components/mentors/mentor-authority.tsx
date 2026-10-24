import { FoundingMentorCredential } from "@/components/mentors/founding-mentor-credential";
import {
  hasMentorContributions,
  type MentorContributionMetrics,
} from "@/lib/mentors/contributions";
import { hasProfileValue } from "@/lib/profile/presentation";

type MentorAuthorityProps = {
  expertise: string[];
  mentorStatement: string | null;
  whyIMentor?: string | null;
  contributions?: MentorContributionMetrics | null;
  showCredential?: boolean;
  credentialFirst?: boolean;
  showQualified?: boolean;
  showWhyIMentor?: boolean;
};

const CONTRIBUTION_LABELS: Array<{
  key: keyof MentorContributionMetrics;
  label: string;
}> = [
  { key: "reviewsContributed", label: "Reviews contributed" },
  { key: "projectsReviewed", label: "Projects reviewed" },
  { key: "buildersHelped", label: "Builders helped" },
  { key: "validationsCompleted", label: "Validations completed" },
];

export function MentorAuthority({
  expertise,
  mentorStatement,
  whyIMentor = null,
  contributions = null,
  showCredential = true,
  credentialFirst = false,
  showQualified = false,
  showWhyIMentor = false,
}: MentorAuthorityProps) {
  const statement = hasProfileValue(mentorStatement) ? mentorStatement : null;
  const why = showWhyIMentor && hasProfileValue(whyIMentor) ? whyIMentor : null;
  const credential = showCredential ? (
    <FoundingMentorCredential showStatement={false} />
  ) : null;
  const visibleContributions =
    contributions && hasMentorContributions(contributions)
      ? CONTRIBUTION_LABELS.filter((item) => contributions[item.key] > 0)
      : [];

  return (
    <div className="max-w-xl space-y-4">
      {credentialFirst ? credential : null}
      {statement ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mentor Statement
          </p>
          <p className="mt-1.5 text-lg font-medium leading-7 text-foreground">
            {statement}
          </p>
        </div>
      ) : null}
      {expertise.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Areas of Expertise
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {expertise.map((area) => (
              <li
                key={area}
                className="text-base font-medium tracking-tight text-foreground"
              >
                {area}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {showQualified && expertise.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Qualified to review
          </p>
          <ul className="mt-1.5 space-y-1">
            {expertise.map((area) => (
              <li
                key={area}
                className="flex items-start gap-2 text-sm font-medium text-foreground"
              >
                <span aria-hidden className="text-[#9a7433]">
                  ✓
                </span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {why ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Why I Mentor
          </p>
          <p className="mt-1.5 text-base leading-7 text-foreground">{why}</p>
        </div>
      ) : null}
      {visibleContributions.length > 0 && contributions ? (
        <dl className="space-y-1">
          {visibleContributions.map((item) => (
            <div key={item.key} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {contributions[item.key]}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {credentialFirst ? null : credential}
    </div>
  );
}

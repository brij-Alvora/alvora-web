import { MentorAuthority } from "@/components/mentors/mentor-authority";
import type { MentorContributionMetrics } from "@/lib/mentors/contributions";

type FoundingMentorStatusProps = {
  expertise: string[];
  mentorStatement: string | null;
  whyIMentor?: string | null;
  contributions?: MentorContributionMetrics | null;
};

export function FoundingMentorStatus({
  expertise,
  mentorStatement,
  whyIMentor = null,
  contributions = null,
}: FoundingMentorStatusProps) {
  return (
    <MentorAuthority
      expertise={expertise}
      mentorStatement={mentorStatement}
      whyIMentor={whyIMentor}
      contributions={contributions}
      credentialFirst
      showQualified
      showWhyIMentor
    />
  );
}

import { Card, CardContent } from "@/components/ui/card";

import { FOUNDING_MENTOR_STATEMENT } from "@/lib/mentors/copy";

export function FoundingMentorStatus() {
  return (
    <Card className="border-[#e0d0a4] shadow-sm">
      <CardContent className="space-y-1 p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[#8d7344]">
          Founding Mentor Status
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">Active</p>
        <p className="text-sm font-medium text-[#8d7344]">Founding Cohort 2026</p>
        <p className="pt-2 text-sm leading-6 text-muted-foreground">
          {FOUNDING_MENTOR_STATEMENT}
        </p>
      </CardContent>
    </Card>
  );
}

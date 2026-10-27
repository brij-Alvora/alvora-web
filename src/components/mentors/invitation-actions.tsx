"use client";

import Link from "next/link";

import { trackAcquisitionEventAction } from "@/lib/actions/acquisition";
import { trackBrowserEvent } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";

const APPROVAL_COPY =
  "Founding Mentor status is granted to selected members of the Beta Cohort after review by the Alvora team.";

function trackContinue() {
  trackBrowserEvent("invited_mentor_continue_clicked", {
    page_path: "/founding-mentors",
  });
  void trackAcquisitionEventAction({
    eventName: "invited_mentor_continue_clicked",
    path: "/founding-mentors",
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    search: typeof window !== "undefined" ? window.location.search : undefined,
    mentorIntent: true,
  });
}

export function InvitationActions({
  isMentor,
  isSignedIn,
}: {
  isMentor: boolean;
  isSignedIn: boolean;
}) {
  if (isMentor) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Your Founding Mentor status is already approved for Beta Cohort 2026.
        </p>
        <Button asChild size="lg">
          <Link href="/profile/edit">Complete your mentor profile</Link>
        </Button>
      </div>
    );
  }

  const href = isSignedIn ? "/profile/edit" : "/register?next=/profile/edit";

  return (
    <div className="space-y-3">
      <Button asChild size="lg">
        <Link href={href} onClick={trackContinue}>
          Continue as an Invited Mentor
        </Link>
      </Button>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {APPROVAL_COPY}
      </p>
      {isSignedIn ? (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Finish your profile next. Completing it does not add the credential.
        </p>
      ) : (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          <Link
            href="/login?next=/profile/edit"
            className="font-medium text-foreground hover:underline"
            onClick={trackContinue}
          >
            Sign in
          </Link>{" "}
          if you already have an account, then complete your profile. The
          credential follows approval.
        </p>
      )}
    </div>
  );
}

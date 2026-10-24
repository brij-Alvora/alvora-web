"use client";

import { useId } from "react";

import {
  FOUNDING_MENTOR_STATEMENT,
  FOUNDING_MENTOR_TOOLTIP,
} from "@/lib/mentors/copy";
import { cn } from "@/lib/utils";

export { FOUNDING_MENTOR_STATEMENT, FOUNDING_MENTOR_TOOLTIP };

type FoundingMentorCredentialProps = {
  statement?: string;
  showStatement?: boolean;
  className?: string;
};

export function FoundingMentorCredential({
  statement = FOUNDING_MENTOR_STATEMENT,
  showStatement = true,
  className,
}: FoundingMentorCredentialProps) {
  const tooltipId = useId();

  return (
    <div className={cn("relative block w-full max-w-xl", className)}>
      <div
        tabIndex={0}
        aria-describedby={tooltipId}
        className="peer w-full rounded-lg border border-[#e0d0a4] bg-card px-3.5 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#a6843d]/40"
      >
        <FoundingMentorMark />
        {showStatement ? (
          <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{statement}</p>
        ) : null}
      </div>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-30 mt-1.5 w-72 rounded-md border border-border bg-popover px-2.5 py-2 text-xs leading-5 text-popover-foreground opacity-0 shadow-md peer-hover:visible peer-hover:opacity-100 peer-focus:visible peer-focus:opacity-100"
      >
        {FOUNDING_MENTOR_TOOLTIP}
      </span>
    </div>
  );
}

export function FoundingMentorMark() {
  return (
    <div className="flex items-center gap-2.5">
      <MentorMedal className="h-5 w-5 shrink-0 text-[#9a7433]" />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-medium tracking-tight text-foreground">
          Founding Mentor
        </p>
        <p className="text-xs font-medium tracking-wide text-[#8d7344]">
          Beta Cohort 2026
        </p>
      </div>
    </div>
  );
}

function MentorMedal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M6.4 1.8h2.1L9.6 5.2H7.8L6.4 1.8Z" fill="currentColor" opacity="0.45" />
      <path d="M11.5 1.8h2.1L12.2 5.2h-1.8l1.1-3.4Z" fill="currentColor" />
      <circle
        cx="10"
        cy="12.2"
        r="6.1"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle cx="10" cy="12.2" r="3.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

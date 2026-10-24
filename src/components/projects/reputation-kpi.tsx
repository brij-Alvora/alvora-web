"use client";

import { Info, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import {
  REPUTATION_EVENT_LABELS,
  REPUTATION_POINTS,
} from "@/lib/reputation/rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReputationKpiProps = {
  points: number;
  level: string;
  fromValidations: number;
  fromReviews: number;
};

export function ReputationKpi({
  points,
  level,
  fromValidations,
  fromReviews,
}: ReputationKpiProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Card
        className={cn(
          "h-full shadow-sm transition-colors hover:bg-secondary/40",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <Link href="/reputation" className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" aria-hidden />
                Reputation
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                {points}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{level}</p>
              {(fromValidations > 0 || fromReviews > 0) ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {fromValidations > 0
                    ? `${fromValidations} from project validations`
                    : null}
                  {fromValidations > 0 && fromReviews > 0 ? <br /> : null}
                  {fromReviews > 0
                    ? `${fromReviews} from community reviews`
                    : null}
                </p>
              ) : null}
            </Link>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label="How reputation is earned"
              onClick={() => setOpen((value) => !value)}
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="How reputation is earned"
          className="absolute left-0 right-0 top-[calc(100%-0.5rem)] z-30 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md"
        >
          <p className="text-sm font-medium">How reputation is earned</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Points are awarded from real activity. Your level is calculated from
            the sum of these events.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {(
              Object.keys(REPUTATION_POINTS) as Array<
                keyof typeof REPUTATION_POINTS
              >
            ).map((type) => (
              <li key={type} className="flex justify-between gap-3">
                <span>{REPUTATION_EVENT_LABELS[type]}</span>
                <span className="tabular-nums text-foreground">
                  {REPUTATION_POINTS[type] > 0 ? "+" : ""}
                  {REPUTATION_POINTS[type]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

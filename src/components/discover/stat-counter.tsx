"use client";

import { useEffect, useState } from "react";

type StatCounterProps = {
  value: number;
  label: string;
};

export function StatCounter({ value, label }: StatCounterProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value <= 0) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const duration = 700;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - (1 - progress) ** 2)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {shown}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

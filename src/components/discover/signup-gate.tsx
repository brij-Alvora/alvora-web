"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { registerHref } from "@/lib/onboarding/flywheel";

type SignupGateProps = {
  signedIn: boolean;
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "button" | "link";
  intent?: "builder" | "reviewer";
};

export function SignupGate({
  signedIn,
  href,
  children,
  className,
  variant = "button",
  intent = "builder",
}: SignupGateProps) {
  const [open, setOpen] = useState(false);

  if (signedIn) {
    if (variant === "link") {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <Button asChild size="sm" className={className}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <>
      {variant === "link" ? (
        <button type="button" className={className} onClick={() => setOpen(true)}>
          {children}
        </button>
      ) : (
        <Button type="button" size="sm" className={className} onClick={() => setOpen(true)}>
          {children}
        </Button>
      )}
      {open ? <SignupModal intent={intent} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function SignupModal({
  onClose,
  intent = "builder",
}: {
  onClose: () => void;
  intent?: "builder" | "reviewer";
}) {
  const titleId = useId();
  const href = registerHref(intent);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-2xl tracking-tight text-foreground">
          {intent === "reviewer"
            ? "Write your first review"
            : "Get a written review of your work"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {intent === "reviewer"
            ? "Create an account, confirm your email, complete your profile, then open the validation queue."
            : "Create an account, confirm your email, complete your profile, then publish a project and request validation."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="sm:flex-1">
            <Link href={href}>Create account</Link>
          </Button>
          <Button type="button" variant="outline" className="sm:flex-1" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}

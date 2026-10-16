"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminMfaGateProps = {
  currentAal: string;
  enforced: boolean;
  children: React.ReactNode;
};

export function AdminMfaGate({
  currentAal,
  enforced,
  children,
}: AdminMfaGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const onSetup = pathname === "/admin/mfa";
  const blocked = enforced && currentAal !== "aal2" && !onSetup;

  useEffect(() => {
    if (blocked) router.replace("/admin/mfa");
  }, [blocked, router]);

  if (blocked) {
    return (
      <p className="text-sm text-muted-foreground">
        Redirecting to authenticator setup…
      </p>
    );
  }

  return children;
}

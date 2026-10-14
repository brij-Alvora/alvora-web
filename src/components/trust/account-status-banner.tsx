import Link from "next/link";

import type { AccountStatus } from "@/lib/supabase/types";

export function AccountStatusBanner({ status }: { status: AccountStatus }) {
  if (status !== "warned" && status !== "suspended") return null;

  const warned = status === "warned";
  return (
    <div className="border-b border-border bg-secondary/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {warned
            ? "Your account has a warning. Please follow community guidelines."
            : "Your account is suspended. You can still contact Support to appeal."}
        </p>
        <Link href="/support" className="font-medium underline-offset-4 hover:underline">
          Contact support
        </Link>
      </div>
    </div>
  );
}

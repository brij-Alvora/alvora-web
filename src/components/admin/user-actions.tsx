"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setAccountStatusAction } from "@/lib/actions/admin";
import type { AccountStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

type UserActionsProps = {
  profileId: string;
  username: string;
  status: AccountStatus;
};

export function UserActions({ profileId, username, status }: UserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (next: AccountStatus) => {
    startTransition(async () => {
      await setAccountStatusAction(profileId, next);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/admin/users/${profileId}`}>View user</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={`/u/${username}`}>Public profile</Link>
      </Button>
      {status === "suspended" ? (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run("active")}
        >
          Reactivate
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => run("suspended")}
        >
          Suspend
        </Button>
      )}
    </div>
  );
}

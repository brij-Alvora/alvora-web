"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setAccountStatusAction } from "@/lib/actions/admin";
import { toast } from "@/lib/toast";
import type { AccountStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserActionsProps = {
  profileId: string;
  username: string;
  status: AccountStatus;
};

export function UserActions({ profileId, username, status }: UserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const run = (next: AccountStatus) => {
    startTransition(async () => {
      const result = await setAccountStatusAction(profileId, next, reason);
      if (result.error) toast(result.error, "error");
      else toast(result.success ?? "Updated");
      setReason("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/users/${profileId}`}>View user</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/u/${username}`}>Public profile</Link>
        </Button>
      </div>
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Moderation reason (required for warn/suspend/ban)"
        className="max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        {status !== "warned" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending || !reason.trim()}
            onClick={() => run("warned")}
          >
            Warn
          </Button>
        ) : null}
        {status !== "suspended" ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending || !reason.trim()}
            onClick={() => run("suspended")}
          >
            Suspend
          </Button>
        ) : null}
        {status !== "banned" ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending || !reason.trim()}
            onClick={() => run("banned")}
          >
            Ban
          </Button>
        ) : null}
        {status !== "active" ? (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run("active")}
          >
            Reactivate
          </Button>
        ) : null}
      </div>
    </div>
  );
}

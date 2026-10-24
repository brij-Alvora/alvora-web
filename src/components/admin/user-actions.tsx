"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  setAccountStatusAction,
  setFoundingMentorAction,
} from "@/lib/actions/admin";
import { formatExpertise } from "@/lib/mentors/expertise";
import { toast } from "@/lib/toast";
import type { AccountStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserActionsProps = {
  profileId: string;
  username: string;
  status: AccountStatus;
  isFoundingMentor: boolean;
  expertise?: string[];
};

export function UserActions({
  profileId,
  username,
  status,
  isFoundingMentor,
  expertise,
}: UserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [expertiseText, setExpertiseText] = useState(
    formatExpertise(expertise),
  );

  const run = (next: AccountStatus) => {
    startTransition(async () => {
      const result = await setAccountStatusAction(profileId, next, reason);
      if (result.error) toast(result.error, "error");
      else toast(result.success ?? "Updated");
      setReason("");
      router.refresh();
    });
  };

  const setMentor = (next: boolean, includeExpertise: boolean) => {
    startTransition(async () => {
      const result = await setFoundingMentorAction(
        profileId,
        next,
        includeExpertise ? expertiseText : undefined,
      );
      if (result.error) toast(result.error, "error");
      else toast(result.success ?? "Updated");
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
      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Founding Mentor
        </p>
        {expertise ? (
          <div className="space-y-2">
            <Label htmlFor={`expertise-${profileId}`}>Expertise</Label>
            <Input
              id={`expertise-${profileId}`}
              value={expertiseText}
              onChange={(event) => setExpertiseText(event.target.value)}
              placeholder="Product, UX, AI agents"
              className="max-w-sm"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setMentor(isFoundingMentor, true)}
            >
              Save expertise
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {isFoundingMentor ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setMentor(false, false)}
            >
              Remove Founding Mentor
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => setMentor(true, expertise !== undefined)}
            >
              Mark as Founding Mentor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

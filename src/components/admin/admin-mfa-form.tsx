"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  challengeAdminTotpAction,
  enrollAdminTotpAction,
  verifyAdminTotpAction,
} from "@/lib/actions/admin-mfa";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminMfaFormProps = {
  currentAal: string;
  enrolledFactorId?: string;
  enforced: boolean;
};

export function AdminMfaForm({
  currentAal,
  enrolledFactorId,
  enforced,
}: AdminMfaFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [factorId, setFactorId] = useState(enrolledFactorId ?? "");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current assurance: {currentAal.toUpperCase()}.{" "}
        {enforced
          ? "Admin routes require AAL2 before public beta."
          : "Enforcement is off in this environment. Set ADMIN_MFA_REQUIRED=true to require TOTP."}
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {qrCode ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Scan this QR code</p>
          {/* QR from Supabase is an svg data URL */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="TOTP QR code" className="h-48 w-48 rounded-md border" />
          <p className="break-all text-xs text-muted-foreground">{secret}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await enrollAdminTotpAction();
              if (result.error) {
                setError(result.error);
                return;
              }
              setFactorId(result.factorId ?? "");
              setQrCode(result.qrCode ?? "");
              setSecret(result.secret ?? "");
            });
          }}
        >
          {enrolledFactorId ? "Add another authenticator" : "Enroll authenticator"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !factorId}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const id = factorId;
              if (!id) {
                setError("Enroll an authenticator first, then challenge it.");
                return;
              }
              const result = await challengeAdminTotpAction(id);
              if (result.error) {
                setError(result.error);
                return;
              }
              setChallengeId(result.challengeId ?? "");
            });
          }}
        >
          Send challenge
        </Button>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            if (!factorId || !challengeId) {
              setError("Enroll and challenge the authenticator before verifying.");
              return;
            }
            const result = await verifyAdminTotpAction({
              factorId,
              challengeId,
              code,
            });
            if (result.error) {
              setError(result.error);
              return;
            }
            setSuccess(result.success ?? "Verified");
            router.refresh();
            router.push("/admin");
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="totp">Authenticator code</Label>
          <Input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Verifying..." : "Verify and continue"}
        </Button>
      </form>
    </div>
  );
}

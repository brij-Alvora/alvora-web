"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginAction, resendConfirmationAction } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_failed:
    "That confirmation link is invalid or expired. Sign in, or request a new email.",
  banned: "This account is banned.",
  unconfirmed:
    "Confirm your email before signing in. Check your inbox for the link.",
};

type LoginFormProps = {
  nextPath?: string;
  initialError?: string;
};

export function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const [error, setError] = useState<string | null>(
    initialError ? (CALLBACK_ERRORS[initialError] ?? initialError) : null,
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginInput) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await loginAction(values, nextPath);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      {initialError === "unconfirmed" || error?.includes("Confirm your email") ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={isPending}
          onClick={() => {
            const email = getValues("email");
            setError(null);
            startTransition(async () => {
              const result = await resendConfirmationAction(email);
              if (result.error) setError(result.error);
              if (result.success) setSuccess(result.success);
            });
          }}
        >
          Resend confirmation email
        </Button>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link
          href="/register?intent=builder"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Get your work reviewed
        </Link>
      </p>
    </form>
  );
}

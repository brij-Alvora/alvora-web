import { TrackAcquisitionEvent } from "@/components/analytics/track-event";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { firstParam, type SearchValues } from "@/lib/admin/params";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata = {
  title: "Create account · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params, "next") || "/dashboard");

  return (
    <AuthShell
      title="Create your identity"
      description="Register to claim your public builder profile."
    >
      <TrackAcquisitionEvent eventName="signup_started" />
      <RegisterForm nextPath={nextPath} />
    </AuthShell>
  );
}

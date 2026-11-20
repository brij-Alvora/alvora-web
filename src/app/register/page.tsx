import { TrackAcquisitionEvent } from "@/components/analytics/track-event";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { firstParam, type SearchValues } from "@/lib/admin/params";
import { safeNextPath } from "@/lib/auth/next-path";
import { parseFlywheelIntent } from "@/lib/onboarding/flywheel";

export const metadata = {
  title: "Create account · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params, "next") || "/profile/edit");
  const intent = parseFlywheelIntent(firstParam(params, "intent"));

  return (
    <AuthShell
      title={intent === "reviewer" ? "Start reviewing" : "Get your work reviewed"}
      description={
        intent === "reviewer"
          ? "Confirm your email, complete your profile, then open the validation queue."
          : "Confirm your email, complete your profile, then publish a project and request validation."
      }
    >
      <TrackAcquisitionEvent eventName="signup_started" />
      <RegisterForm nextPath={nextPath} />
    </AuthShell>
  );
}

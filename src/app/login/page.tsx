import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { firstParam, type SearchValues } from "@/lib/admin/params";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata = {
  title: "Sign in · Alvora",
};

type PageProps = {
  searchParams: Promise<SearchValues>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstParam(params, "next") || "/dashboard");
  const initialError = firstParam(params, "error");

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your builder workspace."
    >
      <LoginForm nextPath={nextPath} initialError={initialError} />
    </AuthShell>
  );
}

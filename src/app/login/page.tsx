import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in · Alvora",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your builder identity."
    >
      <LoginForm />
    </AuthShell>
  );
}

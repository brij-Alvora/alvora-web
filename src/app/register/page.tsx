import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create account · Alvora",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your identity"
      description="Register to claim your public builder profile."
    >
      <RegisterForm />
    </AuthShell>
  );
}

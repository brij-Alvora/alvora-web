import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset password · Alvora",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We'll email you a secure link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

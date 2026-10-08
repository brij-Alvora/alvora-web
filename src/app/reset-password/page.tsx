import { redirect } from "next/navigation";

import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Choose new password · Alvora",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=reset_session_required");
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Your reset link is verified. Set a strong password to continue."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

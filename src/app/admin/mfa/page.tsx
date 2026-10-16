import { AdminMfaForm } from "@/components/admin/admin-mfa-form";
import { getAdminAssuranceLevel, listAdminMfaFactors } from "@/lib/admin/assurance";
import { isAdminMfaRequired } from "@/lib/admin/mfa";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Admin MFA · Alvora",
};

export default async function AdminMfaPage() {
  const [aal, factors] = await Promise.all([
    getAdminAssuranceLevel(),
    listAdminMfaFactors(),
  ]);

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Authenticator app (TOTP)
          </h2>
          <p className="text-sm text-muted-foreground">
            Enroll a TOTP factor, then verify a 6-digit code to raise this
            session to AAL2.
          </p>
        </div>
        <AdminMfaForm
          currentAal={aal}
          enrolledFactorId={factors[0]?.id}
          enforced={isAdminMfaRequired()}
        />
      </CardContent>
    </Card>
  );
}

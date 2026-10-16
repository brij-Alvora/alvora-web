import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMfaGate } from "@/components/admin/admin-mfa-gate";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin/access";
import { getAdminInbox } from "@/lib/admin/alerts";
import { getAdminAssuranceLevel } from "@/lib/admin/assurance";
import { isAal2, isAdminMfaRequired } from "@/lib/admin/mfa";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const [inbox, aal] = await Promise.all([
    getAdminInbox(),
    getAdminAssuranceLevel(),
  ]);
  const enforced = isAdminMfaRequired();
  const pathname = (await headers()).get("x-alvora-pathname") ?? "";
  if (
    enforced &&
    !isAal2(aal) &&
    pathname.startsWith("/admin") &&
    pathname !== "/admin/mfa"
  ) {
    redirect("/admin/mfa");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-sm font-medium text-primary">Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform users, validation, reviews, and live metrics.
        </p>
      </div>
      <AdminNav alertCount={inbox.count} />
      <AdminMfaGate currentAal={aal} enforced={enforced}>
        {children}
      </AdminMfaGate>
    </div>
  );
}

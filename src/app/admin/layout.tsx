import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin/access";
import { getAdminInbox } from "@/lib/admin/alerts";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const inbox = await getAdminInbox();

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
      {children}
    </div>
  );
}

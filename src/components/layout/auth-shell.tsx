import Link from "next/link";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-foreground"
          >
            Alvora
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

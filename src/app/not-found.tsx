import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That link does not match a page on Alvora.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Back to home
      </Link>
    </div>
  );
}

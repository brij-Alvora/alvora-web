"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        This page could not load
      </h1>
      <p className="text-sm text-muted-foreground">
        Please try again. If it keeps happening, contact support.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl tracking-tight">Profile not found</h1>
      <p className="text-muted-foreground">
        That username does not exist on Alvora yet.
      </p>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}

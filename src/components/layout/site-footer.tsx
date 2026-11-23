import Link from "next/link";

import { BrandLockup } from "@/components/brand/alvora-mark";
import {
  ADMIN_EMAIL,
  ADMIN_MAILTO,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "@/lib/legal/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <BrandLockup href="/" size="sm" />
          <p>Builder identity and validation</p>
          <p>
            Support:{" "}
            <a href={SUPPORT_MAILTO} className="hover:text-foreground">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p>
            Admin:{" "}
            <a href={ADMIN_MAILTO} className="hover:text-foreground">
              {ADMIN_EMAIL}
            </a>
          </p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/discover" className="hover:text-foreground">
            Discover
          </Link>
          <Link href="/founding-mentors" className="hover:text-foreground">
            Founding Mentors
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/acceptable-use" className="hover:text-foreground">
            Acceptable use
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}

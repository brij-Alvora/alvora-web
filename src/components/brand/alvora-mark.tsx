import Link from "next/link";

type AlvoraMarkProps = {
  className?: string;
  title?: string;
};

export function AlvoraMark({ className, title }: AlvoraMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        fill="var(--primary-foreground)"
        d="M16 6.5L24.2 25h-3.4l-1.55-3.6h-6.5L11.2 25H7.8L16 6.5zm-2.55 11.4h5.1L16 11.2l-2.55 6.7z"
      />
    </svg>
  );
}

type BrandLockupProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { mark: "h-6 w-6", type: "text-sm" },
  md: { mark: "h-7 w-7", type: "text-lg" },
  lg: { mark: "h-9 w-9", type: "text-2xl" },
};

export function BrandLockup({ href = "/", size = "md" }: BrandLockupProps) {
  const scale = SIZES[size];
  const content = (
    <>
      <AlvoraMark className={`${scale.mark} shrink-0`} />
      <span className={`font-display tracking-tight ${scale.type}`}>Alvora</span>
    </>
  );

  if (!href) {
    return (
      <span className="inline-flex items-center gap-2 text-foreground">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-foreground no-underline hover:opacity-90"
    >
      {content}
    </Link>
  );
}

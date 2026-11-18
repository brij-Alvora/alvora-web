import Link from "next/link";

type AlvoraMarkProps = {
  className?: string;
  title?: string;
};

/** 01 Canonical Open — Apex Bar. Display master. */
export function AlvoraMark({ className, title }: AlvoraMarkProps) {
  return (
    <svg
      viewBox="-31.333 0 62.666 84"
      fill="#0f766e"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d="M-3 0 L3 0 L31.333 77.844 L14.418 84 L0 44.386 L-14.418 84 L-31.333 77.844 Z" />
      <rect x="-3.825" y="58.193" width="7.651" height="12" />
    </svg>
  );
}

type BrandLockupProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { mark: "h-6 w-auto", type: "text-sm leading-none" },
  md: { mark: "h-6 w-auto", type: "text-lg leading-none" },
  lg: { mark: "h-8 w-auto", type: "text-xl leading-none" },
};

export function BrandLockup({ href = "/", size = "md" }: BrandLockupProps) {
  const scale = SIZES[size];
  const content = (
    <>
      <AlvoraMark className={`${scale.mark} shrink-0`} />
      <span className={`font-sans font-medium tracking-tight ${scale.type}`}>
        Alvora
      </span>
    </>
  );

  if (!href) {
    return (
      <span className="inline-flex items-center gap-2.5 text-foreground">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 text-foreground no-underline hover:opacity-90"
      aria-label="Alvora"
    >
      {content}
    </Link>
  );
}

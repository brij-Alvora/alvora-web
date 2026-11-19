import { thumbnailMonogram, thumbnailPaletteIndex } from "@/lib/discover/catalog-quality";
import { cn } from "@/lib/utils";

type ProjectThumbnailProps = {
  src?: string | null;
  alt: string;
  variant?: "card" | "hero" | "preview";
};

const VARIANT_CLASS = {
  card: "aspect-video",
  preview: "aspect-video rounded-md border border-border",
  hero: "aspect-[16/9] sm:aspect-[2/1]",
} as const;

const PALETTES = [
  { from: "#0f766e", to: "#15201c", bar: "#d6c39a" },
  { from: "#1f4d47", to: "#0e1c19", bar: "#7ebfb6" },
  { from: "#245c4a", to: "#15201c", bar: "#e8efe9" },
  { from: "#3d4a45", to: "#1a2420", bar: "#0f766e" },
  { from: "#1c3d38", to: "#0f1a17", bar: "#c4b07a" },
] as const;

export function ProjectThumbnail({
  src,
  alt,
  variant = "card",
}: ProjectThumbnailProps) {
  const palette = PALETTES[thumbnailPaletteIndex(alt, PALETTES.length)];
  const monogram = thumbnailMonogram(alt);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-secondary",
        VARIANT_CLASS[variant],
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={variant === "hero" ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-contain object-center"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${palette.from} 0%, ${palette.to} 100%)`,
          }}
        >
          <span
            aria-hidden
            className="font-display text-3xl tracking-tight text-white/90 sm:text-4xl"
          >
            {monogram}
          </span>
          <span
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: palette.bar }}
          />
        </div>
      )}
    </div>
  );
}

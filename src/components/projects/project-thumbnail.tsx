import { ImageIcon } from "lucide-react";

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

export function ProjectThumbnail({
  src,
  alt,
  variant = "card",
}: ProjectThumbnailProps) {
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
          className="absolute inset-0 h-full w-full object-contain object-center"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="h-6 w-6" aria-hidden />
          <span className="text-xs font-medium">No thumbnail</span>
        </div>
      )}
    </div>
  );
}

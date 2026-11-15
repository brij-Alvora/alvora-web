type ExplainerVideoProps = {
  src: string;
  poster?: string;
  title: string;
};

export function ExplainerVideo({ src, poster, title }: ExplainerVideoProps) {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="relative aspect-video w-full bg-muted">
          <video
            className="h-full w-full"
            controls
            playsInline
            preload="metadata"
            poster={poster}
            aria-label={title}
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}

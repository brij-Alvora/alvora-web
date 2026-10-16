import type { FeedbackSnapshot } from "@/lib/projects/performance";

type FeedbackSnapshotBlockProps = {
  snapshot: FeedbackSnapshot;
  compact?: boolean;
};

export function FeedbackSnapshotBlock({
  snapshot,
  compact = false,
}: FeedbackSnapshotBlockProps) {
  const rows = (
    compact
      ? [
          { label: "Works well", value: snapshot.strength },
          { label: "Improve", value: snapshot.improvement },
        ]
      : [
          { label: "Works well", value: snapshot.strength },
          { label: "Improve", value: snapshot.improvement },
          { label: "Recommend", value: snapshot.recommendation },
        ]
  ).filter((row) => row.value);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {compact
          ? "No feedback yet."
          : "No reviewer notes yet. Request validation to collect feedback."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="text-xs text-muted-foreground">{row.label}</p>
          <p className="line-clamp-2 text-sm leading-5 text-foreground">
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}

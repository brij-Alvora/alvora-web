export function AdminFields({
  items,
}: {
  items: { label: string; value: string | number | null | undefined }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm font-medium">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

type ExpertiseListProps = {
  areas: string[];
};

export function ExpertiseList({ areas }: ExpertiseListProps) {
  if (areas.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {areas.map((area) => (
        <li
          key={area}
          className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
        >
          {area}
        </li>
      ))}
    </ul>
  );
}

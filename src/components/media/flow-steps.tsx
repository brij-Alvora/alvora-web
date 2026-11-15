type FlowStepsProps = {
  steps: readonly string[];
};

export function FlowSteps({ steps }: FlowStepsProps) {
  return (
    <ol className="flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-2 sm:gap-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex flex-col items-center sm:flex-row sm:gap-2">
          {index > 0 ? (
            <span
              className="py-0.5 text-muted-foreground sm:py-0"
              aria-hidden
            >
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">→</span>
            </span>
          ) : null}
          <span className="text-sm font-medium tracking-tight text-foreground">
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

export type FunnelStep = {
  key: string;
  label: string;
  value: number;
  percentOfSignup: number;
  percentOfPrevious: number;
};

export function buildFunnelSteps(
  values: Array<{ key: string; label: string; value: number }>,
): FunnelStep[] {
  const baseline = values[0]?.value ?? 0;
  return values.map((step, index) => {
    const previous = index === 0 ? step.value : values[index - 1]?.value ?? 0;
    return {
      ...step,
      percentOfSignup:
        baseline === 0 ? 0 : Math.round((step.value / baseline) * 100),
      percentOfPrevious:
        previous === 0 ? 0 : Math.round((step.value / previous) * 100),
    };
  });
}

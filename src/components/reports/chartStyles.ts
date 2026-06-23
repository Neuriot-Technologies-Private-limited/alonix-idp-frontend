import type { ChartColors } from '../../hooks/useChartColors';

export function chartTooltipStyle(colors: ChartColors) {
  return {
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    fontSize: '11px',
    color: colors.muted,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
  };
}

export function chartLegendStyle(colors: ChartColors) {
  return {
    fontSize: '10px',
    fontWeight: 700,
    color: colors.muted,
    paddingTop: '8px',
  };
}

export function chartAxisTick(colors: ChartColors) {
  return { fontSize: 10, fill: colors.muted };
}

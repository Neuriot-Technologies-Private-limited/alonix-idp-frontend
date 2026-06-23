import { useEffect, useState } from 'react';
import { useThemeStore } from '../stores/themeStore';

export interface ChartColors {
  primary: string;
  success: string;
  destructive: string;
  info: string;
  violet: string;
  muted: string;
  border: string;
  background: string;
  grid: string;
}

const FALLBACK_DARK: ChartColors = {
  primary: '#8CB4FF',
  success: '#34D399',
  destructive: '#FF8A80',
  info: '#38BDF8',
  violet: '#C4B5FD',
  muted: '#A8B0C4',
  border: '#424754',
  background: '#1B1F26',
  grid: 'rgba(100, 116, 139, 0.28)',
};

const FALLBACK_LIGHT: ChartColors = {
  primary: '#005AC1',
  success: '#0F766E',
  destructive: '#DC2626',
  info: '#0891B2',
  violet: '#7C3AED',
  muted: '#5F6368',
  border: '#C4C7CF',
  background: '#FDFBFF',
  grid: 'rgba(100, 116, 139, 0.22)',
};

function readVar(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = style.getPropertyValue(name).trim();
  return value || fallback;
}

/** Resolve design tokens to hex/rgb strings Recharts SVG can render. */
export function readChartColors(theme: 'light' | 'dark' = 'dark'): ChartColors {
  const fallback = theme === 'light' ? FALLBACK_LIGHT : FALLBACK_DARK;
  if (typeof document === 'undefined') return fallback;

  const style = getComputedStyle(document.documentElement);
  const border = readVar(style, '--color-border', fallback.border);

  return {
    primary: readVar(style, '--color-primary', fallback.primary),
    success: readVar(style, '--color-success', fallback.success),
    destructive: readVar(style, '--color-destructive', fallback.destructive),
    info: readVar(style, '--color-info', fallback.info),
    violet: readVar(style, '--color-violet', fallback.violet),
    muted: readVar(style, '--color-muted-foreground', fallback.muted),
    border,
    background: readVar(style, '--color-surface-highest', fallback.background),
    grid: fallback.grid,
  };
}

/** Convert #RRGGBB to rgba for fills and gradients. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '').trim();
  if (!hex) return `rgba(140, 180, 255, ${alpha})`;
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex.slice(0, 6);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(140, 180, 255, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useChartColors(): ChartColors {
  const theme = useThemeStore((s) => s.theme);
  const [colors, setColors] = useState<ChartColors>(() => readChartColors(theme));

  useEffect(() => {
    const apply = () => setColors(readChartColors(theme));
    apply();
    const id = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return colors;
}

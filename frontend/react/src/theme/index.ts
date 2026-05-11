import type { OrderType } from '@/domain/types';

const slate = {
  200: '#e2e8f0',
  400: '#94a3b8',
  500: '#64748b',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
} as const;

const palette = {
  slate,
  red: {
    300: '#fca5a5',
    500: '#ef4444',
  },
  amber: {
    100: '#fef3c7',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
  },
  sky: {
    300: '#7dd3fc',
    500: '#0ea5e9',
  },
  blue: {
    500: '#3b82f6',
  },
  emerald: {
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },
  green: {
    500: '#22c55e',
  },
  base: {
    black: '#000000',
    white: '#ffffff',
  },
} as const;

const colors = {
  palette,
  background: {
    app: palette.slate[900],
    surface: '#111827',
    card: '#0b1220',
  },
  text: {
    primary: palette.slate[200],
    muted: palette.slate[400],
    empty: palette.slate[500],
    inverse: palette.base.white,
  },
  border: {
    default: palette.slate[800],
  },
  action: {
    primary: palette.blue[500],
    success: palette.emerald[600],
    successHover: palette.emerald[500],
  },
  status: {
    danger: palette.red[500],
    dangerText: palette.red[300],
    warning: palette.amber[500],
    warningText: palette.amber[300],
    warningMessage: palette.amber[400],
    warningMuted: palette.amber[100],
    info: palette.sky[500],
    infoText: palette.sky[300],
    successAccent: palette.emerald[400],
  },
  overlay: {
    modal: 'rgba(0, 0, 0, 0.6)',
    chartHover: 'rgba(255, 255, 255, 0.04)',
  },
} as const;

const cssVariableHsl = {
  background: '222 47% 5%',
  foreground: '210 40% 95%',
  card: '222 47% 7%',
  cardForeground: '210 40% 95%',
  popover: '222 47% 7%',
  popoverForeground: '210 40% 95%',
  primary: '217 91% 60%',
  primaryForeground: '222 47% 5%',
  secondary: '217 33% 17%',
  secondaryForeground: '210 40% 95%',
  muted: '217 33% 17%',
  mutedForeground: '215 20% 65%',
  accent: '217 33% 17%',
  accentForeground: '210 40% 95%',
  destructive: '0 84% 60%',
  destructiveForeground: '210 40% 98%',
  border: '217 33% 17%',
  input: '217 33% 17%',
  ring: '217 91% 60%',
  success: '161 94% 30%',
  successHover: '160 84% 39%',
  successForeground: '0 0% 100%',
  successAccent: '158 64% 52%',
  danger: '0 84% 60%',
  dangerForeground: '0 94% 82%',
  warning: '38 92% 50%',
  warningForeground: '46 97% 65%',
  warningMessage: '43 96% 56%',
  warningMuted: '48 97% 89%',
  info: '200 89% 48%',
  infoForeground: '199 96% 74%',
  tooltip: '229 84% 5%',
  tooltipForeground: '210 40% 95%',
  emptyForeground: '215 16% 47%',
  overlay: '0 0% 0%',
} as const;

export const themeCssVariables = {
  '--background': cssVariableHsl.background,
  '--foreground': cssVariableHsl.foreground,
  '--card': cssVariableHsl.card,
  '--card-foreground': cssVariableHsl.cardForeground,
  '--popover': cssVariableHsl.popover,
  '--popover-foreground': cssVariableHsl.popoverForeground,
  '--primary': cssVariableHsl.primary,
  '--primary-foreground': cssVariableHsl.primaryForeground,
  '--secondary': cssVariableHsl.secondary,
  '--secondary-foreground': cssVariableHsl.secondaryForeground,
  '--muted': cssVariableHsl.muted,
  '--muted-foreground': cssVariableHsl.mutedForeground,
  '--accent': cssVariableHsl.accent,
  '--accent-foreground': cssVariableHsl.accentForeground,
  '--destructive': cssVariableHsl.destructive,
  '--destructive-foreground': cssVariableHsl.destructiveForeground,
  '--border': cssVariableHsl.border,
  '--input': cssVariableHsl.input,
  '--ring': cssVariableHsl.ring,
  '--success': cssVariableHsl.success,
  '--success-hover': cssVariableHsl.successHover,
  '--success-foreground': cssVariableHsl.successForeground,
  '--success-accent': cssVariableHsl.successAccent,
  '--danger': cssVariableHsl.danger,
  '--danger-foreground': cssVariableHsl.dangerForeground,
  '--warning': cssVariableHsl.warning,
  '--warning-foreground': cssVariableHsl.warningForeground,
  '--warning-message': cssVariableHsl.warningMessage,
  '--warning-muted': cssVariableHsl.warningMuted,
  '--info': cssVariableHsl.info,
  '--info-foreground': cssVariableHsl.infoForeground,
  '--tooltip': cssVariableHsl.tooltip,
  '--tooltip-foreground': cssVariableHsl.tooltipForeground,
  '--empty-foreground': cssVariableHsl.emptyForeground,
  '--overlay': cssVariableHsl.overlay,
  '--radius': '0.5rem',
} as const satisfies Record<`--${string}`, string>;

const orderTypes: Record<OrderType, { label: string; color: string }> = {
  EMERGENCY: {
    label: 'Emergency',
    color: colors.status.danger,
  },
  OVER_DUE: {
    label: 'Overdue',
    color: colors.status.warning,
  },
  DAILY: {
    label: 'Daily',
    color: colors.status.info,
  },
};

const charts = {
  background: palette.slate[900],
  grid: palette.slate[800],
  tick: palette.slate[400],
  tooltipText: palette.slate[200],
  tooltipCursor: colors.overlay.chartHover,
  stock: {
    used: palette.blue[500],
    remaining: palette.green[500],
  },
  credit: {
    normal: palette.blue[500],
    warning: colors.status.warning,
    danger: colors.status.danger,
  },
} as const;

export const theme = {
  colors,
  cssVariableHsl,
  orderTypes,
  charts,
} as const;

export type AppTheme = typeof theme;

export function applyTheme(target: HTMLElement = document.documentElement) {
  for (const [key, value] of Object.entries(themeCssVariables)) {
    target.style.setProperty(key, value);
  }
}

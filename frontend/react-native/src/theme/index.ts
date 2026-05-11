import type { OrderType } from '../domain/types';

const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
} as const;

const base = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

const palette = {
  slate,
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    300: '#fca5a5',
    500: '#ef4444',
    600: '#dc2626',
  },
  amber: {
    100: '#fef3c7',
    500: '#f59e0b',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    300: '#93c5fd',
    600: '#2563eb',
  },
  emerald: {
    500: '#10b981',
    600: '#059669',
  },
  teal: {
    700: '#0f766e',
  },
  violet: {
    600: '#7c3aed',
  },
  overlay: {
    soft: 'rgba(0, 0, 0, 0.4)',
    strong: 'rgba(15, 23, 42, 0.45)',
  },
} as const;

const colors = {
  ...base,
  palette,
  background: {
    app: base.white,
    page: slate[50],
    surface: base.white,
    muted: slate[50],
    subtle: slate[100],
  },
  text: {
    primary: slate[900],
    strong: slate[950],
    secondary: slate[700],
    muted: slate[500],
    placeholder: slate[400],
    inverse: base.white,
    danger: palette.red[600],
  },
  border: {
    default: slate[200],
    strong: slate[300],
    focus: palette.blue[300],
    danger: palette.red[300],
  },
  action: {
    primary: slate[900],
    secondary: slate[200],
    success: palette.emerald[600],
    disabledOpacity: 0.7,
  },
  status: {
    success: palette.emerald[500],
    warning: palette.amber[500],
    danger: palette.red[600],
    info: palette.blue[600],
    accent: palette.violet[600],
    teal: palette.teal[700],
  },
  chart: {
    track: slate[200],
    barTrack: slate[300],
    demandMuted: palette.red[100],
  },
  modal: {
    backdrop: palette.overlay.strong,
    scrim: palette.overlay.soft,
  },
} as const;

const orderTypes: Record<OrderType, { label: string; color: string; muted: string }> = {
  EMERGENCY: {
    label: 'Emergency',
    color: colors.status.danger,
    muted: palette.red[100],
  },
  OVER_DUE: {
    label: 'Overdue',
    color: colors.status.warning,
    muted: palette.amber[100],
  },
  DAILY: {
    label: 'Daily',
    color: colors.status.info,
    muted: palette.blue[100],
  },
};

const charts = {
  warehousePalette: [
    colors.status.teal,
    colors.status.info,
    colors.status.danger,
    colors.status.accent,
    colors.status.warning,
  ],
} as const;

export const theme = {
  colors,
  orderTypes,
  charts,
} as const;

export type AppTheme = typeof theme;

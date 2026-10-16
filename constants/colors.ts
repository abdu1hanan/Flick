// Color tokens for Flick — Minimalist Orange & Black Theme
const darkTheme = {
  background: '#09090B',
  cardBackground: '#131316',
  cardBackgroundHover: '#1A1A1E',
  border: '#202024',
  borderSubtle: '#18181C',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E96',
  textMuted: '#52525B',
  accent: '#FF6B00',
  accentHover: '#FF7D1A',
  accentMuted: 'rgba(255, 107, 0, 0.12)',
  accentGlow: 'rgba(255, 107, 0, 0.25)',
  danger: '#EF4444',
  success: '#10B981',
  islandBlack: '#000000',
  islandText: '#FFFFFF',
  buttonBlack: '#141416',
  buttonBorder: '#27272A',
  chartBar: '#FF6B00',
  chartBarToday: '#FF6B00',
  chartBarInactive: '#1E1E22',
  statCardBg: '#131316',
  shadow: '#000000',
} as const;

export type ThemeColors = { [K in keyof typeof darkTheme]: string };
export type ColorScheme = 'light' | 'dark';

export const Colors: Record<string, ThemeColors> & {
  light: ThemeColors;
  dark: ThemeColors;
  unspecified: ThemeColors;
} = {
  light: darkTheme, // Pure Dark / Orange theme is default for Flick
  dark: darkTheme,
  unspecified: darkTheme,
};

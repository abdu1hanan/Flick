// Color tokens for light and dark mode
const lightTheme = {
  background: '#F7F7F8',
  cardBackground: '#FFFFFF',
  border: '#E8E8EC',
  textPrimary: '#0E0E10',
  textSecondary: '#6B6B72',
  accent: '#6B5CE7',
  accentMuted: '#EDE9FB',
  danger: '#E74C3C',
  islandBlack: '#000000',
  islandText: '#FFFFFF',
  chartBar: '#6B5CE7',
  chartBarToday: '#6B5CE7',
  chartBarInactive: '#D8D4F5',
  statCardBg: '#FFFFFF',
  shadow: '#000',
} as const;

const darkTheme = {
  background: '#0E0E10',
  cardBackground: '#1A1A1E',
  border: '#2C2C30',
  textPrimary: '#F0F0F4',
  textSecondary: '#8A8A94',
  accent: '#8B7CF6',
  accentMuted: '#2D2852',
  danger: '#E74C3C',
  islandBlack: '#000000',
  islandText: '#FFFFFF',
  chartBar: '#8B7CF6',
  chartBarToday: '#8B7CF6',
  chartBarInactive: '#2D2852',
  statCardBg: '#1A1A1E',
  shadow: '#000',
} as const;

export type ThemeColors = { [K in keyof typeof lightTheme]: string };
export type ColorScheme = 'light' | 'dark';

export const Colors: Record<string, ThemeColors> & {
  light: ThemeColors;
  dark: ThemeColors;
  unspecified: ThemeColors;
} = {
  light: lightTheme,
  dark: darkTheme,
  unspecified: lightTheme,
};



export const colors = {
  primary: '#16a34a', // Emerald green
  primaryDark: '#15803d',
  primaryLight: '#dcfce7',
  primaryForeground: '#ffffff',

  secondary: '#0284c7', // Sky blue
  secondaryLight: '#e0f2fe',
  secondaryDark: '#0369a1',

  accent: '#d97706', // Earth / Harvest Amber
  accentLight: '#fef3c7',
  accentDark: '#b45309',

  background: '#f8fafc', // Light slate
  card: '#ffffff',
  surface: '#ffffff',
  surfaceSubtle: '#f1f5f9',

  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderStrong: '#cbd5e1',

  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',

  // Agricultural specific badges
  soil: '#854d0e',
  soilLight: '#fef9c3',
  crop: '#15803d',
  cropLight: '#f0fdf4',
  water: '#0369a1',
  waterLight: '#e0f2fe',
  disease: '#b91c1c',
  diseaseLight: '#fee2e2',
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const radius = {
  xs: 2,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
};

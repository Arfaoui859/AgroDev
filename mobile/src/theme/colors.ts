export const colors = {
  primary: '#16a34a', // Emerald green
  primaryDark: '#15803d',
  primaryLight: '#dcfce7',
  primaryForeground: '#ffffff',

  // AgriVibe identity: the deep green of the launcher icon plus the bronze and
  // illuminated-leaf greens that the emblem itself carries.
  brandDeep: '#0b3b22',
  brandDeepLight: '#10522f',
  brandBronze: '#b06a38',
  brandBronzeLight: '#d9a06a',
  brandLeaf: '#4aa25f',

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

  // Neutral scrim for modal/sheet backdrops and image overlays.
  scrim: 'rgba(15, 23, 42, 0.55)',
  scrimLight: 'rgba(15, 23, 42, 0.28)',
  // Darker neutral used for pill labels laid over imagery (e.g. video duration).
  scrimStrong: 'rgba(15, 23, 42, 0.82)',

  // White-on-brand overlays for hero surfaces, gradient cards and camera controls.
  onBrandFaint: 'rgba(255, 255, 255, 0.7)',
  onBrandSubtle: 'rgba(255, 255, 255, 0.85)',
  onBrandMuted: 'rgba(255, 255, 255, 0.9)',
  onBrandStrong: 'rgba(255, 255, 255, 0.95)',
  onBrandBorder: 'rgba(255, 255, 255, 0.25)',
  onBrandSurface: 'rgba(255, 255, 255, 0.2)',
  // Tinted red used for error pills floating over the camera preview.
  dangerScrim: 'rgba(220, 38, 38, 0.85)',
  // Opaque black behind captured/previewed imagery (camera and gallery preview).
  imageBackdrop: '#000000',
};

/**
 * Multi-stop gradients for premium surfaces. Kept as plain arrays so the same
 * definitions drive `expo-linear-gradient` and any future canvas/PDF export.
 * Every gradient is a same-hue ramp (no muddy midpoints) so text contrast stays
 * predictable for the light-on-dark hero copy.
 */
export const gradients = {
  hero: ['#15803d', '#16a34a', '#22c55e'] as const,
  harvest: ['#b45309', '#d97706', '#f59e0b'] as const,
  sky: ['#0369a1', '#0284c7', '#38bdf8'] as const,
  earth: ['#854d0e', '#a16207', '#ca8a04'] as const,
};

export const typography = {
  // Arabic-first sizing: Arabic script has taller ascenders/descenders and
  // diacritics, so the floor is kept a step above the usual Latin minimum and
  // paired with a generous line height (see `lineHeights`) for legibility.
  fontSizes: {
    xs: 13,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    /** Oversized hero numerals (e.g. the current temperature). */
    display: 54,
  },
  // Line height ≈ 1.5× the paired font size, which reads well for Arabic and
  // Latin alike. Use these instead of ad-hoc line-height literals.
  lineHeights: {
    xs: 20,
    sm: 21,
    base: 24,
    lg: 27,
    xl: 30,
    display: 81,
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
  /** Brand-tinted shadow for the prominent floating controls (e.g. assistant tab). */
  primary: {
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

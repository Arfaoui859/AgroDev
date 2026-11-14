/**
 * Localised weather-condition labels.
 *
 * The Express gateway (Open-Meteo provider) returns a machine icon key plus an
 * Arabic description. The Arabic description is the only human-readable text
 * the provider emits, so French and English callers must not be shown it.
 * We translate the icon key locally instead of inventing a description.
 */
const ICON_LABELS: Record<string, { ar: string; fr: string; en: string }> = {
  sunny: { ar: 'صافٍ', fr: 'Ensoleillé', en: 'Sunny' },
  'partly-cloudy': { ar: 'غائم جزئياً', fr: 'Partiellement nuageux', en: 'Partly cloudy' },
  cloudy: { ar: 'غائم', fr: 'Nuageux', en: 'Cloudy' },
  mist: { ar: 'ضباب', fr: 'Brouillard', en: 'Mist' },
  drizzle: { ar: 'رذاذ', fr: 'Bruine', en: 'Drizzle' },
  rain: { ar: 'مطر', fr: 'Pluie', en: 'Rain' },
  snow: { ar: 'ثلوج', fr: 'Neige', en: 'Snow' },
  thunderstorm: { ar: 'عاصفة رعدية', fr: 'Orage', en: 'Thunderstorm' },
  unknown: { ar: 'غير معروف', fr: 'Inconnu', en: 'Unknown' },
};

/**
 * Human-readable condition for the given provider icon key.
 *
 * `fallbackAr` is the provider's own Arabic description; it is only used for the
 * Arabic locale, where it is more specific than the icon label. For French and
 * English the icon label is used, and an unknown icon falls back to the neutral
 * localised "Unknown" rather than leaking the Arabic text.
 */
export function weatherConditionLabel(
  icon: string | undefined,
  language: string,
  fallbackAr?: string,
): string {
  if (language === 'ar') return fallbackAr || (icon ? ICON_LABELS[icon]?.ar : undefined) || ICON_LABELS.unknown.ar;
  const entry = (icon && ICON_LABELS[icon]) || ICON_LABELS.unknown;
  return language === 'fr' ? entry.fr : entry.en;
}

/**
 * Machine icon key -> MaterialCommunityIcons glyph. Kept as plain strings so
 * this module stays free of a React Native icon import; screens pass the result
 * straight to `MaterialCommunityIcons name=`.
 */
export const WEATHER_ICON_GLYPHS: Record<string, string> = {
  sunny: 'weather-sunny',
  'partly-cloudy': 'weather-partly-cloudy',
  cloudy: 'weather-cloudy',
  mist: 'weather-fog',
  drizzle: 'weather-rainy',
  rain: 'weather-pouring',
  snow: 'weather-snowy',
  thunderstorm: 'weather-lightning-rainy',
  unknown: 'weather-cloudy',
};

/** Glyph name for the provider icon key, defaulting to a neutral cloud. */
export function weatherIconName(icon: string | undefined): string {
  return (icon && WEATHER_ICON_GLYPHS[icon]) || WEATHER_ICON_GLYPHS.unknown;
}

/**
 * Icon colour family for the condition. Returns a semantic key (not a raw hex)
 * so the caller resolves it against the theme.
 */
export function weatherIconTone(icon: string | undefined): 'accent' | 'info' | 'secondary' | 'muted' {
  switch (icon) {
    case 'sunny':
    case 'partly-cloudy':
      return 'accent';
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      return 'info';
    case 'snow':
      return 'secondary';
    default:
      return 'muted';
  }
}

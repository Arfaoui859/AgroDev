/**
 * Tunisian governorate coordinates.
 *
 * The gateway's `/api/weather/coordinates` endpoint resolves a real Open-Meteo
 * forecast for a lat/lon pair, so the app needs a small, stable lookup to turn a
 * governorate into coordinates. These are the same reference points the web
 * client uses; they are geographic facts, not derived data.
 */

export interface Governorate {
  id: string;
  /** Display label in Arabic (the app is Arabic-first). */
  label: string;
  /** Matching label used by the French/English UI. */
  labelFr: string;
  labelEn: string;
  lat: number;
  lon: number;
}

export const GOVERNORATES: Governorate[] = [
  { id: 'tunis', label: 'تونس الكبرى', labelFr: 'Grand Tunis', labelEn: 'Greater Tunis', lat: 36.8065, lon: 10.1815 },
  { id: 'kairouan', label: 'القيروان', labelFr: 'Kairouan', labelEn: 'Kairouan', lat: 35.6781, lon: 10.0963 },
  { id: 'beja', label: 'باجة والشمال', labelFr: 'Béja et Nord', labelEn: 'Béja & North', lat: 36.7256, lon: 9.1817 },
  { id: 'sousse', label: 'سوسة والساحل', labelFr: 'Sousse et Sahel', labelEn: 'Sousse & Sahel', lat: 35.8256, lon: 10.6369 },
  { id: 'sfax', label: 'صفاقس', labelFr: 'Sfax', labelEn: 'Sfax', lat: 34.7406, lon: 10.7603 },
  { id: 'kebili', label: 'قبلي وتوزر', labelFr: 'Kébili et Tozeur', labelEn: 'Kébili & Tozeur', lat: 33.7047, lon: 8.9694 },
];

export const DEFAULT_GOVERNORATE = GOVERNORATES[0];

/** Find a governorate by id, falling back to the default (Greater Tunis). */
export function findGovernorate(id: string | undefined | null): Governorate {
  if (!id) return DEFAULT_GOVERNORATE;
  return GOVERNORATES.find((g) => g.id === id) ?? DEFAULT_GOVERNORATE;
}

/**
 * Best-effort match of a free-text governorate name (as stored on a user
 * profile) to a known coordinate. Returns the default when nothing matches so
 * weather can still be shown for the user's country.
 */
export function governorateFromName(name: string | undefined | null): Governorate {
  if (!name) return DEFAULT_GOVERNORATE;
  const needle = name.trim().toLowerCase();
  const direct = GOVERNORATES.find(
    (g) =>
      g.id === needle ||
      g.label.toLowerCase().includes(needle) ||
      g.labelEn.toLowerCase().includes(needle) ||
      g.labelFr.toLowerCase().includes(needle) ||
      needle.includes(g.id),
  );
  return direct ?? DEFAULT_GOVERNORATE;
}

/** Localised label for a governorate in the active language. */
export function governorateLabel(gov: Governorate, language: string): string {
  if (language === 'fr') return gov.labelFr;
  if (language === 'en') return gov.labelEn;
  return gov.label;
}

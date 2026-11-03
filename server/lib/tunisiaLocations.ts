/**
 * Canonical Tunisian location coordinates.
 *
 * Several weather modules accept a place identifier from the UI ("tunis",
 * "sfax", ...) and need coordinates to query a real provider. Keeping one
 * table avoids the drift where each route invented its own station list and
 * silently fell back to synthetic weather for unknown ids.
 *
 * `name` is the Arabic display name; `lat`/`lng` are decimal degrees.
 */
export interface TunisiaLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
}

export const TUNISIA_LOCATIONS: TunisiaLocation[] = [
  { id: "tunis", name: "تونس العاصمة", lat: 36.8065, lng: 10.1815, elevation: 4 },
  { id: "sfax", name: "صفاقس", lat: 34.7406, lng: 10.7603, elevation: 4 },
  { id: "sousse", name: "سوسة", lat: 35.8256, lng: 10.6369, elevation: 4 },
  { id: "kairouan", name: "القيروان", lat: 35.6781, lng: 10.0963, elevation: 68 },
  { id: "gabes", name: "قابس", lat: 33.8815, lng: 10.0982, elevation: 5 },
  { id: "bizerte", name: "بنزرت", lat: 37.2746, lng: 9.8739, elevation: 6 },
  { id: "gafsa", name: "قفصة", lat: 34.425, lng: 8.7842, elevation: 314 },
  { id: "tozeur", name: "توزر", lat: 33.9197, lng: 8.1348, elevation: 87 },
];

/**
 * Resolve a free-form location identifier to coordinates.
 *
 * Accepts the canonical ids above as well as the "<id>-center" aliases used by
 * the weather-station routes, case-insensitively. Returns undefined when the
 * place is unknown so callers can answer 404 instead of inventing weather.
 */
export function resolveTunisiaLocation(
  raw: string | undefined | null,
): TunisiaLocation | undefined {
  if (!raw) return undefined;
  const key = String(raw).trim().toLowerCase();
  const normalised = key.endsWith("-center") ? key.slice(0, -"-center".length) : key;
  return TUNISIA_LOCATIONS.find(
    (loc) => loc.id === normalised || loc.name === raw,
  );
}

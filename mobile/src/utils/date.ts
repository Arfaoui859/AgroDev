import { Language } from '../i18n';

/**
 * BCP-47 locale per app language, used for date/number formatting.
 *
 * Formatting every timestamp with a fixed `ar-TN` locale (as an earlier
 * revision did) shows Arabic-Indic digits and Arabic month names to French and
 * English users. Picking the locale from the active language keeps the whole
 * UI in one language.
 */
export function localeFor(language: Language | string): string {
  if (language === 'fr') return 'fr-TN';
  if (language === 'en') return 'en-GB';
  return 'ar-TN';
}

export function formatDateTime(iso: string | null | undefined, language: Language | string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso ?? '';
  return date.toLocaleString(localeFor(language), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string | null | undefined, language: Language | string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(localeFor(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date, language: Language | string): string {
  return date.toLocaleTimeString(localeFor(language), { hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(value: number, language: Language | string): string {
  return value.toLocaleString(localeFor(language));
}

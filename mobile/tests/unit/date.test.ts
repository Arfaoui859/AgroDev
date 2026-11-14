import { formatDate, formatDateTime, formatNumber, formatTime, localeFor } from '../../src/utils/date';

describe('locale-aware formatting', () => {
  it('maps each app language to a matching BCP-47 locale', () => {
    expect(localeFor('ar')).toBe('ar-TN');
    expect(localeFor('fr')).toBe('fr-TN');
    expect(localeFor('en')).toBe('en-GB');
  });

  it('formats a date in the active language, not always Arabic', () => {
    const iso = '2026-11-14T08:30:00.000Z';
    const ar = formatDateTime(iso, 'ar');
    const fr = formatDateTime(iso, 'fr');
    const en = formatDateTime(iso, 'en');
    // The three locales must not produce byte-identical output.
    expect(fr).not.toBe(ar);
    expect(en).not.toBe(ar);
    expect(ar.length).toBeGreaterThan(0);
  });

  it('returns an empty string for missing or invalid input instead of "Invalid Date"', () => {
    expect(formatDateTime(null, 'en')).toBe('');
    expect(formatDateTime('', 'en')).toBe('');
    expect(formatDateTime('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDate(null, 'fr')).toBe('');
    expect(formatDate('not-a-date', 'fr')).toBe('');
  });

  it('localises numbers and times per language', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatTime(new Date('2026-11-14T08:30:00'), 'en')).toMatch(/8:30/);
  });
});

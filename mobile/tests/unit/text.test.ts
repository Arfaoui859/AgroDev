import { containsArabic, anyContainsArabic } from '../../src/utils/text';

describe('containsArabic', () => {
  it('detects Arabic script', () => {
    expect(containsArabic('اللفحة المتأخرة')).toBe(true);
    expect(containsArabic('مرحبا بالعالم')).toBe(true);
  });

  it('returns false for latin text and non-strings', () => {
    expect(containsArabic('Late blight')).toBe(false);
    expect(containsArabic('')).toBe(false);
    expect(containsArabic(null)).toBe(false);
    expect(containsArabic(undefined)).toBe(false);
  });
});

describe('anyContainsArabic', () => {
  it('is true when any entry has Arabic', () => {
    expect(anyContainsArabic(['Late blight', 'اللفحة', 'fruiting'])).toBe(true);
  });

  it('is false when no entry has Arabic', () => {
    expect(anyContainsArabic(['Late blight', 'Mildiou', null])).toBe(false);
  });
});

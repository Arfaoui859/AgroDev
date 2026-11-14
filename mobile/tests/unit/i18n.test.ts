import { getTranslations, isRTL } from '../../src/i18n';
import { getExtra } from '../../src/i18n/extra';

describe('i18n', () => {
  it('exposes Arabic-first RTL', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('fr')).toBe(false);
    expect(isRTL('en')).toBe(false);
  });

  it('provides all three languages with the same key surface', () => {
    const ar = getTranslations('ar');
    const fr = getTranslations('fr');
    const en = getTranslations('en');
    const keys = Object.keys(ar).sort();
    expect(keys.length).toBeGreaterThan(50);
    expect(Object.keys(fr).sort()).toEqual(keys);
    expect(Object.keys(en).sort()).toEqual(keys);
    expect(ar.appName).toBeTruthy();
  });

  it('keeps the extended translation surface at parity across ar/fr/en', () => {
    const ar = getExtra('ar');
    const fr = getExtra('fr');
    const en = getExtra('en');
    const keys = Object.keys(ar).sort();
    expect(keys.length).toBeGreaterThan(50);
    expect(Object.keys(fr).sort()).toEqual(keys);
    expect(Object.keys(en).sort()).toEqual(keys);
    // No locale may ship an empty string for a key it declares.
    for (const key of keys as (keyof typeof ar)[]) {
      expect(typeof ar[key]).toBe('string');
      expect(String(ar[key]).length).toBeGreaterThan(0);
      expect(String(fr[key]).length).toBeGreaterThan(0);
      expect(String(en[key]).length).toBeGreaterThan(0);
    }
  });
});

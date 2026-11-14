import { weatherConditionLabel, weatherIconName, weatherIconTone } from '../../src/utils/weather';

describe('weather condition localisation', () => {
  it('uses the provider description for Arabic', () => {
    expect(weatherConditionLabel('partly-cloudy', 'ar', 'غائم جزئياً')).toBe('غائم جزئياً');
  });

  it('translates the icon key for French and English, never leaking Arabic', () => {
    const ar = 'غائم جزئياً';
    expect(weatherConditionLabel('partly-cloudy', 'fr', ar)).toBe('Partiellement nuageux');
    expect(weatherConditionLabel('partly-cloudy', 'en', ar)).toBe('Partly cloudy');
  });

  it('never shows the Arabic description to non-Arabic callers for an unknown icon', () => {
    expect(weatherConditionLabel('brand-new-code', 'fr', 'غائم')).toBe('Inconnu');
    expect(weatherConditionLabel('brand-new-code', 'en', 'غائم')).toBe('Unknown');
    expect(weatherConditionLabel(undefined, 'en', 'غائم')).toBe('Unknown');
  });

  it('falls back to the icon label for Arabic when the provider text is missing', () => {
    expect(weatherConditionLabel('rain', 'ar')).toBe('مطر');
  });
});

describe('weather icon mapping', () => {
  it('maps known provider keys to distinct glyphs', () => {
    expect(weatherIconName('sunny')).toBe('weather-sunny');
    expect(weatherIconName('rain')).toBe('weather-pouring');
    expect(weatherIconName('thunderstorm')).toBe('weather-lightning-rainy');
  });

  it('never renders a sunny glyph for an unknown or missing condition', () => {
    expect(weatherIconName('brand-new-code')).toBe('weather-cloudy');
    expect(weatherIconName(undefined)).toBe('weather-cloudy');
    expect(weatherIconName('brand-new-code')).not.toBe('weather-sunny');
  });

  it('assigns a condition-appropriate colour tone', () => {
    expect(weatherIconTone('sunny')).toBe('accent');
    expect(weatherIconTone('rain')).toBe('info');
    expect(weatherIconTone('snow')).toBe('secondary');
    expect(weatherIconTone(undefined)).toBe('muted');
  });
});

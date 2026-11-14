import { soilParamLabel } from '../../src/utils/soilLabels';

describe('soilParamLabel', () => {
  it('keeps the Arabic label for Arabic callers', () => {
    expect(soilParamLabel('ph', 'درجة الحموضة (pH)', 'ar')).toBe('درجة الحموضة (pH)');
  });

  it('translates the closed parameter key for fr/en', () => {
    expect(soilParamLabel('nitrogen', 'الآزوت (N)', 'fr')).toBe('Azote (N)');
    expect(soilParamLabel('organicMatter', 'المادة العضوية', 'en')).toBe('Organic matter');
    expect(soilParamLabel('salinity', 'الملوحة (EC)', 'en')).toBe('Salinity (EC)');
  });

  it('falls back to the server Arabic label for an unknown key', () => {
    expect(soilParamLabel('boron', 'البورون', 'fr')).toBe('البورون');
    expect(soilParamLabel(null, 'البورون', 'en')).toBe('البورون');
  });
});

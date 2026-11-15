import { capabilityLabel } from '../../src/utils/capabilityLabels';

describe('capabilityLabel', () => {
  it('prefers the server Arabic name for Arabic callers', () => {
    expect(capabilityLabel('soil-analysis', 'Soil Analysis', 'تحليل التربة', 'ar')).toBe('تحليل التربة');
  });

  it('uses the French label for French callers instead of leaking English', () => {
    expect(capabilityLabel('soil-analysis', 'Soil Analysis', 'تحليل التربة', 'fr')).toBe('Analyse du sol');
    expect(capabilityLabel('market-forecast', 'Market Forecast AI', 'توقّع السوق', 'fr')).toBe(
      'Prévision du marché',
    );
  });

  it('uses the English label for English callers', () => {
    expect(capabilityLabel('agro-chat', 'Agro Chat AI', 'المساعد الفلاحي', 'en')).toBe('Agro Chat AI');
  });

  it('never shows an Arabic name to a non-Arabic caller', () => {
    // An unknown id with no French/English mapping must fall back to English,
    // not to the Arabic name.
    expect(capabilityLabel('future-capability', 'Future Capability', 'قدرة مستقبلية', 'fr')).toBe(
      'Future Capability',
    );
    expect(capabilityLabel('future-capability', 'Future Capability', 'قدرة مستقبلية', 'en')).toBe(
      'Future Capability',
    );
  });

  it('falls back to the id when nothing else is present', () => {
    expect(capabilityLabel('mystery', undefined, undefined, 'en')).toBe('mystery');
    expect(capabilityLabel(undefined, undefined, undefined, 'fr')).toBe('');
  });

  // The full id set declared by GET /api/ai/capabilities. If the server adds a
  // capability, this list grows with it and the FR assertion below forces a
  // French label instead of a silent English leak into the French UI.
  const KNOWN_CAPABILITY_IDS = [
    'soil-analysis',
    'lab-soil-models',
    'crop-recommendation',
    'climate-crop-matcher',
    'plant-disease-detection',
    'leaf-scan',
    'pest-control',
    'weather-yield-planner',
    'yield-predictor',
    'irrigation-optimizer',
    'market-forecast',
    'supply-demand',
    'smart-match',
    'farming-tasks-planner',
    'agro-chat',
    'alert-notifier',
  ];

  it('has a French label for every capability the server declares', () => {
    for (const id of KNOWN_CAPABILITY_IDS) {
      const label = capabilityLabel(id, 'English Name', 'اسم عربي', 'fr');
      expect(label).not.toBe('English Name');
      expect(label).not.toBe('اسم عربي');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('has an Arabic label for every capability when the server omits nameAr', () => {
    for (const id of KNOWN_CAPABILITY_IDS) {
      const label = capabilityLabel(id, 'English Name', undefined, 'ar');
      expect(label).not.toBe('English Name');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

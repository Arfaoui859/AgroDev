import { cropCategory, cropLevel, cropName, cropSeason } from '../../src/utils/cropLabels';

describe('cropLabels', () => {
  it('translates the crop slug for fr/en and keeps Arabic verbatim', () => {
    expect(cropName('olive', 'ar')).toBe('الزيتون');
    expect(cropName('olive', 'fr')).toBe('Olivier');
    expect(cropName('date_palm', 'en')).toBe('Date palm');
  });

  it('translates the closed category enum', () => {
    expect(cropCategory('أشجار مثمرة', 'fr')).toBe('Arbres fruitiers');
    expect(cropCategory('حبوب', 'en')).toBe('Cereals');
    expect(cropCategory('حبوب', 'ar')).toBe('حبوب');
  });

  it('translates a multi-value season list', () => {
    expect(cropSeason('خريف، ربيع', 'fr')).toBe('Automne، Printemps');
    expect(cropSeason('خريف، ربيع', 'en')).toBe('Autumn، Spring');
  });

  it('translates the shared level enum (water need / risk)', () => {
    expect(cropLevel('مرتفع', 'fr')).toBe('Élevé');
    expect(cropLevel('منخفض', 'en')).toBe('Low');
    expect(cropLevel('عالٍ', 'en')).toBe('High');
  });

  it('passes unknown values through instead of inventing a label', () => {
    expect(cropName('quinoa', 'fr')).toBe('quinoa');
    expect(cropLevel('غريب', 'en')).toBe('غريب');
    expect(cropName('', 'fr')).toBe('');
  });
});

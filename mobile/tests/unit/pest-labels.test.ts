import { pestCategory, pestName } from '../../src/utils/pestLabels';

describe('pestLabels', () => {
  it('uses the Arabic name for Arabic callers', () => {
    expect(pestName('aphids', 'المن', 'ar')).toBe('المن');
  });

  it('translates the pest slug for fr/en', () => {
    expect(pestName('aphids', 'المن', 'fr')).toBe('Pucerons');
    expect(pestName('late_blight', 'اللفحة المتأخرة', 'en')).toBe('Late blight');
  });

  it('falls back to the server Arabic name for an unknown slug (never hides a match)', () => {
    expect(pestName('unknown_pest', 'آفة غريبة', 'fr')).toBe('آفة غريبة');
    expect(pestName(null, 'آفة', 'en')).toBe('آفة');
  });

  it('translates the closed category enum', () => {
    expect(pestCategory('حشرات', 'fr')).toBe('Insectes');
    expect(pestCategory('أمراض فطرية', 'en')).toBe('Fungal diseases');
    expect(pestCategory('غير محدد', 'ar')).toBe('غير محدد');
  });

  it('passes an unknown category through verbatim', () => {
    expect(pestCategory('تصنيف آخر', 'en')).toBe('تصنيف آخر');
  });
});

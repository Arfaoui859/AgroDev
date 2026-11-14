import {
  DEFAULT_GOVERNORATE,
  GOVERNORATES,
  findGovernorate,
  governorateFromName,
  governorateLabel,
} from '../../src/utils/governorates';

describe('governorate lookup (static geographic reference)', () => {
  it('exposes a stable default (Greater Tunis)', () => {
    expect(DEFAULT_GOVERNORATE.id).toBe('tunis');
    expect(DEFAULT_GOVERNORATE.lat).toBeCloseTo(36.8065, 3);
  });

  it('resolves a known id and falls back to the default', () => {
    expect(findGovernorate('sfax').lat).toBeCloseTo(34.7406, 3);
    expect(findGovernorate('does-not-exist').id).toBe('tunis');
    expect(findGovernorate(undefined).id).toBe('tunis');
  });

  it('matches a free-text governorate name to coordinates', () => {
    expect(governorateFromName('صفاقس').id).toBe('sfax');
    expect(governorateFromName('Kairouan').id).toBe('kairouan');
    expect(governorateFromName('').id).toBe('tunis');
  });

  it('localises the label for the active language', () => {
    const beja = GOVERNORATES.find((g) => g.id === 'beja')!;
    expect(governorateLabel(beja, 'ar')).toBe('باجة والشمال');
    expect(governorateLabel(beja, 'fr')).toBe('Béja et Nord');
    expect(governorateLabel(beja, 'en')).toBe('Béja & North');
  });
});

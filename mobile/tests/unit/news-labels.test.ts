import { newsCategoryLabel } from '../../src/utils/newsLabels';

describe('newsCategoryLabel', () => {
  it('translates the French-derived facet slug for ar/en', () => {
    expect(newsCategoryLabel('olive & huile', 'ar')).toBe('زيتون وزيت');
    expect(newsCategoryLabel('céréales', 'en')).toBe('Cereals');
    expect(newsCategoryLabel('élevage', 'en')).toBe('Livestock');
  });

  it('keeps the authored French slug for French callers', () => {
    expect(newsCategoryLabel('maraîchage', 'fr')).toBe('maraîchage');
  });

  it('passes an unknown category through verbatim', () => {
    expect(newsCategoryLabel('agro-tech', 'ar')).toBe('agro-tech');
    expect(newsCategoryLabel('', 'en')).toBe('');
  });
});

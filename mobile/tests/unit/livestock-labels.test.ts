import {
  livestockBreeding,
  livestockGender,
  livestockHealth,
  livestockSpecies,
} from '../../src/utils/livestockLabels';

describe('livestockLabels', () => {
  it('translates the closed species enum', () => {
    expect(livestockSpecies('sheep', 'ar')).toBe('أغنام');
    expect(livestockSpecies('dairy_cattle', 'fr')).toBe('Bovins laitiers');
    expect(livestockSpecies('poultry', 'en')).toBe('Poultry');
  });

  it('translates the closed health enum', () => {
    expect(livestockHealth('good', 'ar')).toBe('جيدة');
    expect(livestockHealth('sick', 'fr')).toBe('Malade');
    expect(livestockHealth('poor', 'en')).toBe('Poor');
  });

  it('translates the closed breeding enum', () => {
    expect(livestockBreeding('pregnant', 'ar')).toBe('حامل');
    expect(livestockBreeding('active', 'fr')).toBe('Active');
  });

  it('translates gender', () => {
    expect(livestockGender('female', 'ar')).toBe('أنثى');
    expect(livestockGender('male', 'en')).toBe('Male');
  });

  it('passes an unknown slug through verbatim', () => {
    expect(livestockSpecies('alpaca', 'fr')).toBe('alpaca');
    expect(livestockHealth('', 'en')).toBe('');
  });
});

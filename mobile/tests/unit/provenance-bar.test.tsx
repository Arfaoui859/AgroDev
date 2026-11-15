import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { ProvenanceBar } from '../../src/components/ui/ProvenanceBar';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

const ruleBased = {
  provenance: 'rule-based' as const,
  isRealData: false,
  source: 'Expert rules',
};

/**
 * ProvenanceBar is the standard provenance row: it must always render the
 * provenance label, and the honest "from cache" note only when asked. Hiding
 * the label would let a rule-based answer pass as observed data.
 */
describe('ProvenanceBar', () => {
  it('always renders the provenance label', async () => {
    await wrap(<ProvenanceBar meta={ruleBased} />);
    expect(screen.getByText('نظام إرشادي (قواعد)')).toBeTruthy();
  });

  it('omits the cache note when the payload is live', async () => {
    await wrap(<ProvenanceBar meta={ruleBased} />);
    expect(screen.queryByText('يتم عرض آخر بيانات محفوظة (وضع عدم الاتصال)')).toBeNull();
  });

  it('renders the cache note when the payload came from the cache', async () => {
    await wrap(<ProvenanceBar meta={ruleBased} cached />);
    expect(screen.getByText('يتم عرض آخر بيانات محفوظة (وضع عدم الاتصال)')).toBeTruthy();
  });
});

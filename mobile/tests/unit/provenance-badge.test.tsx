import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProvenanceBadge } from '../../src/components/ui/ProvenanceBadge';
import { LanguageProvider } from '../../src/context/LanguageContext';

function renderBadge(meta: any, detailed = false) {
  return render(
    <LanguageProvider>
      <ProvenanceBadge meta={meta} detailed={detailed} />
    </LanguageProvider>,
  );
}

describe('ProvenanceBadge', () => {
  it('labels rule-based output as an expert rule engine (never a model)', async () => {
    await renderBadge({ provenance: 'rule-based', isRealData: false, source: 'rule-based-engine' }, true);
    expect(screen.getByText('نظام إرشادي (قواعد)')).toBeTruthy();
    expect(screen.getByText('rule-based-engine')).toBeTruthy();
  });

  it('labels live observations distinctly', async () => {
    await renderBadge({ provenance: 'live-observation', isRealData: true, source: 'open-meteo' });
    expect(screen.getByText('بيانات حية')).toBeTruthy();
  });

  it('labels generative AI answers as LLM', async () => {
    await renderBadge({ provenance: 'llm', isRealData: false });
    expect(screen.getByText('ذكاء توليدي (LLM)')).toBeTruthy();
  });

  it('falls back to an unavailable badge for an unknown provenance', async () => {
    await renderBadge({ provenance: 'something-else', isRealData: false });
    expect(screen.getByText('غير متاح')).toBeTruthy();
  });
});

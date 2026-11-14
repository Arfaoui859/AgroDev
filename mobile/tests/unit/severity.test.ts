import { severityLabel, severityVariant } from '../../src/utils/severity';
import { getExtra } from '../../src/i18n/extra';

describe('severity labels', () => {
  const ar = getExtra('ar');
  const fr = getExtra('fr');
  const en = getExtra('en');

  it('localises each reported severity without inflating it', () => {
    expect(severityLabel('low', ar)).toBe(ar.scannerSeverityLow);
    expect(severityLabel('medium', fr)).toBe(fr.scannerSeverityMedium);
    expect(severityLabel('high', en)).toBe(en.scannerSeverityHigh);
    expect(severityLabel('critical', en)).toBe(en.scannerSeverityCritical);
  });

  it('labels an unreported severity honestly instead of defaulting to medium', () => {
    expect(severityLabel('unknown', ar)).toBe(ar.scannerSeverityUnknown);
    expect(severityLabel(undefined, en)).toBe(en.scannerSeverityUnknown);
    expect(severityLabel(undefined, en)).not.toBe(en.scannerSeverityMedium);
  });

  it('maps variants so unknown is neutral, not a warning', () => {
    expect(severityVariant('low')).toBe('success');
    expect(severityVariant('medium')).toBe('warning');
    expect(severityVariant('high')).toBe('danger');
    expect(severityVariant('critical')).toBe('danger');
    expect(severityVariant('unknown')).toBe('info');
    expect(severityVariant(undefined)).toBe('info');
  });
});

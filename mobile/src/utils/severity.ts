import { ExtraTranslations } from '../i18n/extra';
import { DiseaseSeverity } from '../types';

/** Localised label for a diagnosis severity, never inflating it. */
export function severityLabel(severity: DiseaseSeverity | undefined, x: ExtraTranslations): string {
  switch (severity) {
    case 'low':
      return x.scannerSeverityLow;
    case 'medium':
      return x.scannerSeverityMedium;
    case 'high':
      return x.scannerSeverityHigh;
    case 'critical':
      return x.scannerSeverityCritical;
    default:
      return x.scannerSeverityUnknown;
  }
}

/**
 * Badge styling for a severity. `unknown` is deliberately neutral (muted) so an
 * unreported severity is never dressed up as "medium".
 */
export function severityVariant(
  severity: DiseaseSeverity | undefined,
): 'success' | 'warning' | 'danger' | 'info' {
  switch (severity) {
    case 'low':
      return 'success';
    case 'high':
    case 'critical':
      return 'danger';
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
}

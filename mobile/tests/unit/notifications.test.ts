import { normalizePriority, notificationPriorityLabel } from '../../src/utils/notifications';
import { getExtra } from '../../src/i18n/extra';

describe('normalizePriority', () => {
  it('maps the server vocabulary (low/normal/high/urgent) onto the app scale', () => {
    expect(normalizePriority('urgent')).toBe('critical');
    expect(normalizePriority('high')).toBe('high');
    expect(normalizePriority('normal')).toBe('medium');
    expect(normalizePriority('low')).toBe('low');
  });

  it('accepts the app vocabulary as well', () => {
    expect(normalizePriority('critical')).toBe('critical');
    expect(normalizePriority('medium')).toBe('medium');
  });

  it('defaults an unknown or missing priority to medium', () => {
    expect(normalizePriority('whatever')).toBe('medium');
    expect(normalizePriority(null)).toBe('medium');
    expect(normalizePriority(undefined)).toBe('medium');
  });
});

describe('notificationPriorityLabel', () => {
  it('localises every priority in every language', () => {
    for (const lang of ['ar', 'fr', 'en'] as const) {
      const x = getExtra(lang);
      expect(notificationPriorityLabel('critical', x)).toBe(x.priorityCritical);
      expect(notificationPriorityLabel('high', x)).toBe(x.priorityHigh);
      expect(notificationPriorityLabel('medium', x)).toBe(x.priorityMedium);
      expect(notificationPriorityLabel('low', x)).toBe(x.priorityLow);
    }
  });
});

import { ExtraTranslations } from '../i18n/extra';
import { AppNotification } from '../types';

/**
 * The `notifications` table stores `low | normal | high | urgent`
 * (see server/routes/notifications.ts). The app normalises these to a four-step
 * scale so both vocabularies render as a localised label instead of a raw slug.
 */
export function normalizePriority(raw: unknown): AppNotification['priority'] {
  switch (raw) {
    case 'urgent':
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'normal':
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

export function notificationPriorityLabel(
  priority: AppNotification['priority'],
  x: ExtraTranslations,
): string {
  switch (priority) {
    case 'critical':
      return x.priorityCritical;
    case 'high':
      return x.priorityHigh;
    case 'medium':
      return x.priorityMedium;
    default:
      return x.priorityLow;
  }
}

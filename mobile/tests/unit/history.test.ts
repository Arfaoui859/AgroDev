import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHistoryEntry, clearHistory, getHistory } from '../../src/api/history';

describe('analysis history (device-local)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts empty (nothing is seeded)', async () => {
    expect(await getHistory()).toEqual([]);
  });

  it('stores new entries newest-first', async () => {
    await addHistoryEntry({
      type: 'soil',
      title: 'تحليل التربة',
      summary: 'خصوبة متوسطة',
      badge: 'قواعد',
      badgeVariant: 'warning',
    });
    const list = await addHistoryEntry({
      type: 'disease',
      title: 'تشخيص صورة',
      summary: 'لا نتيجة',
      badge: 'غير متاح',
      badgeVariant: 'danger',
    });
    expect(list).toHaveLength(2);
    expect(list[0].type).toBe('disease');
    expect(list[0].id).toBeTruthy();
    expect(list[0].date).toBeTruthy();
  });

  it('clears the history', async () => {
    await addHistoryEntry({
      type: 'crop',
      title: 'توصيات المحاصيل',
      summary: '3 محاصيل',
      badge: 'قواعد',
      badgeVariant: 'primary',
    });
    await clearHistory();
    expect(await getHistory()).toEqual([]);
  });
});

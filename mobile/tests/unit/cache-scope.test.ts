import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  readCache,
  writeCache,
  clearCache,
  setCacheNamespace,
  namespaceUserId,
} from '../../src/api/cache';

/**
 * The offline cache holds private records (notifications, farms, livestock).
 * These tests guard against one account replaying another's cached records on a
 * shared device.
 */
describe('offline cache user scoping', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    setCacheNamespace(null);
  });

  it('does not let a second user read the first user\'s cached records', async () => {
    setCacheNamespace('user-a');
    await writeCache('notifications', [{ id: 'n1', title: 'A private alert' }]);
    expect(await readCache('notifications')).not.toBeNull();

    // User B signs in on the same device.
    setCacheNamespace('user-b');
    expect(await readCache('notifications')).toBeNull();
  });

  it('keeps each user\'s cache isolated after a round-trip switch', async () => {
    setCacheNamespace('user-a');
    await writeCache('farms', [{ id: 'f-a' }]);
    setCacheNamespace('user-b');
    await writeCache('farms', [{ id: 'f-b' }]);

    setCacheNamespace('user-a');
    const a = await readCache<{ id: string }[]>('farms');
    expect(a?.value[0].id).toBe('f-a');

    setCacheNamespace('user-b');
    const b = await readCache<{ id: string }[]>('farms');
    expect(b?.value[0].id).toBe('f-b');
  });

  it('clearCache drops every user namespace (used on sign-out)', async () => {
    setCacheNamespace('user-a');
    await writeCache('notifications', [{ id: 'n1' }]);
    setCacheNamespace('user-b');
    await writeCache('notifications', [{ id: 'n2' }]);

    await clearCache();

    setCacheNamespace('user-a');
    expect(await readCache('notifications')).toBeNull();
    setCacheNamespace('user-b');
    expect(await readCache('notifications')).toBeNull();
  });

  it('reports the raw id the cache is namespaced to', () => {
    setCacheNamespace('abc123');
    expect(namespaceUserId()).toBe('abc123');
    setCacheNamespace(null);
    expect(namespaceUserId()).toBe('');
  });

  it('never stores a raw (unscoped) key', async () => {
    setCacheNamespace('user-a');
    await writeCache('market:all', { prices: [] });
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k === 'agrogrowth.cache.market:all')).toBe(false);
    expect(keys.some((k) => k.startsWith('agrogrowth.cache.u_user-a.'))).toBe(true);
  });
});

import { secureStorageAdapter } from '../../src/api/secureStorage';
import * as SecureStore from 'expo-secure-store';

const store = (SecureStore as any).__store as Map<string, string>;

describe('secureStorageAdapter UTF-8 chunking', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('stores large Arabic session payloads in byte-safe chunks and restores them exactly', async () => {
    const value = JSON.stringify({
      access_token: 'a'.repeat(1200),
      refresh_token: 'b'.repeat(500),
      user: { user_metadata: { full_name: 'سامي العروسي '.repeat(500) } },
    });

    await secureStorageAdapter.setItem('sb-session', value);

    const pointer = store.get('sb-session');
    expect(pointer).toMatch(/^chunks:v2:/);
    const match = /^chunks:v2:([^:]+):([0-9]+)$/.exec(pointer!);
    expect(match).not.toBeNull();

    const [, generation, countText] = match!;
    const count = Number(countText);
    for (let index = 0; index < count; index += 1) {
      const chunk = store.get(`sb-session.v2.${generation}.${index}`);
      expect(chunk).toBeDefined();
      expect(Buffer.byteLength(chunk!, 'utf8')).toBeLessThanOrEqual(1800);
    }

    await expect(secureStorageAdapter.getItem('sb-session')).resolves.toBe(value);
  });

  it('uses a single SecureStore value only when the UTF-8 byte size is within the limit', async () => {
    const value = 'ع'.repeat(700); // 2,100 UTF-8 bytes despite only 700 JS characters.

    await secureStorageAdapter.setItem('sb-small', value);

    expect(store.get('sb-small')).toMatch(/^chunks:v2:/);
    await expect(secureStorageAdapter.getItem('sb-small')).resolves.toBe(value);
  });

  it('keeps short ASCII sessions in the direct storage format', async () => {
    await secureStorageAdapter.setItem('sb-short', 'x'.repeat(1700));

    expect(store.get('sb-short')).toBe('x'.repeat(1700));
  });
});

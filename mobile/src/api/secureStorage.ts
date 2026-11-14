import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure session storage for the Supabase auth client.
 *
 * `expo-secure-store` has a documented value-size limit (~2048 bytes on
 * Android) and a Supabase session JSON (access token + refresh token + user)
 * routinely exceeds it. We therefore split large values into numbered chunks
 * and reassemble them on read, which keeps the session in the OS keychain /
 * keystore instead of falling back to plaintext storage.
 *
 * On web there is no keychain, so `localStorage` is used (the web build is the
 * least sensitive target and the anon session is already RLS-scoped).
 */

const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '.n';

const isWeb = Platform.OS === 'web';

async function webStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        const store = await webStorage();
        return store ? store.getItem(key) : null;
      }
      const head = await SecureStore.getItemAsync(key);
      if (head === null) return null;

      // `head` is either the raw value (single chunk) or a chunk count marker.
      const count = Number.parseInt(head, 10);
      if (!Number.isInteger(count) || count <= 0) return head;

      const parts: string[] = [];
      for (let i = 0; i < count; i += 1) {
        const part = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}${i}`);
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    } catch (error) {
      console.warn('secureStorage.getItem failed:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        const store = await webStorage();
        if (store) store.setItem(key, value);
        return;
      }
      await secureStorageAdapter.removeItem(key);
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      await SecureStore.setItemAsync(key, String(chunks.length));
      await Promise.all(
        chunks.map((chunk, index) =>
          SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}${index}`, chunk),
        ),
      );
    } catch (error) {
      console.warn('secureStorage.setItem failed:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        const store = await webStorage();
        if (store) store.removeItem(key);
        return;
      }
      const head = await SecureStore.getItemAsync(key);
      const count = head ? Number.parseInt(head, 10) : NaN;
      if (Number.isInteger(count) && count > 0) {
        await Promise.all(
          Array.from({ length: count }, (_, i) =>
            SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}${i}`),
          ),
        );
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('secureStorage.removeItem failed:', error);
    }
  },
};

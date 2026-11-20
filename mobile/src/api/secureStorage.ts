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

// SecureStore's Android limit is measured in UTF-8 bytes, not JS characters.
// Leave headroom below its ~2 KB per-value limit for native serialization.
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '.n';

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/** Split without breaking Unicode code points and keep every SecureStore value below its byte limit. */
function splitUtf8Chunks(value: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;

  for (const character of value) {
    const bytes = utf8ByteLength(character);
    if (current && currentBytes + bytes > maxBytes) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
    }
    current += character;
    currentBytes += bytes;
  }

  if (current) chunks.push(current);
  return chunks;
}

const isWeb = Platform.OS === 'web';

async function cleanupPreviousChunks(key: string, head: string | null): Promise<void> {
  if (!head) return;
  try {
    const v2 = /^chunks:v2:([^:]+):([0-9]+)$/.exec(head);
    if (v2) {
      const [, generation, countText] = v2;
      const count = Number(countText);
      await Promise.all(Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}.v2.${generation}.${i}`),
      ));
      return;
    }
    const legacyCount = Number.parseInt(head, 10);
    if (Number.isInteger(legacyCount) && legacyCount > 0) {
      await Promise.all(Array.from({ length: legacyCount }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}${i}`),
      ));
    }
  } catch (error) {
    // The new pointer/value is already committed; orphan cleanup is best-effort.
    console.warn('secureStorage.cleanupPreviousChunks failed:', error);
  }
}

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

      // Versioned pointers are committed only after every chunk is written.
      const v2 = /^chunks:v2:([^:]+):([0-9]+)$/.exec(head);
      if (v2) {
        const [, generation, countText] = v2;
        const parts: string[] = [];
        for (let i = 0; i < Number(countText); i += 1) {
          const part = await SecureStore.getItemAsync(`${key}.v2.${generation}.${i}`);
          if (part === null) return null;
          parts.push(part);
        }
        return parts.join('');
      }

      // Backward compatibility with sessions written by the previous adapter.
      const legacyCount = Number.parseInt(head, 10);
      if (!Number.isInteger(legacyCount) || legacyCount <= 0) return head;
      const parts: string[] = [];
      for (let i = 0; i < legacyCount; i += 1) {
        const part = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}${i}`);
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    } catch (error) {
      console.warn('secureStorage.getItem failed:', error);
      throw error;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        const store = await webStorage();
        if (store) store.setItem(key, value);
        return;
      }
      // Keep the previous committed session intact until the replacement
      // is fully written. Supabase treats a resolved setItem as durable, so
      // write failures must propagate instead of being silently swallowed.
      const previousHead = await SecureStore.getItemAsync(key);
      if (utf8ByteLength(value) <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        await cleanupPreviousChunks(key, previousHead);
        return;
      }

      const chunks = splitUtf8Chunks(value, CHUNK_SIZE);
      const generation = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const chunkPrefix = `${key}.v2.${generation}.`;
      await Promise.all(
        chunks.map((chunk, index) =>
          SecureStore.setItemAsync(`${chunkPrefix}${index}`, chunk),
        ),
      );
      // Commit pointer last: a crash before this write leaves the old session
      // readable and only orphaned temporary chunks.
      await SecureStore.setItemAsync(key, `chunks:v2:${generation}:${chunks.length}`);
      await cleanupPreviousChunks(key, previousHead);
    } catch (error) {
      console.warn('secureStorage.setItem failed:', error);
      throw error;
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
      const v2 = head ? /^chunks:v2:([^:]+):([0-9]+)$/.exec(head) : null;
      if (v2) {
        const [, generation, countText] = v2;
        await Promise.all(Array.from({ length: Number(countText) }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}.v2.${generation}.${i}`),
        ));
      } else {
        const legacyCount = head ? Number.parseInt(head, 10) : NaN;
        if (Number.isInteger(legacyCount) && legacyCount > 0) {
          await Promise.all(Array.from({ length: legacyCount }, (_, i) =>
            SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}${i}`),
          ));
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('secureStorage.removeItem failed:', error);
    }
  },
};

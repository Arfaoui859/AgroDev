import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_TTL_MS } from '../config';

/**
 * Small TTL cache used to keep read-only screens usable in the field where
 * connectivity is intermittent. It stores the last successful JSON payload per
 * key and the time it was written. Cache entries are never presented as fresh
 * network data: callers receive a `fromCache` flag and the UI labels it.
 */

const PREFIX = 'agrogrowth.cache.';

/**
 * Per-user cache namespace.
 *
 * Cached payloads include private records (notifications, farms, livestock)
 * that the gateway returns for the signed-in caller. Without scoping, a second
 * account used on the same device could replay the first account's private
 * records from the offline cache. Every key is therefore namespaced by the
 * signed-in user id (or `anon` when signed out) and the whole cache is dropped
 * on sign-out.
 */
let namespace = 'anon';

/** Point the cache at a user's namespace. Call on sign-in/sign-out. */
export function setCacheNamespace(userId: string | null): void {
  namespace = userId ? `u_${userId}` : 'anon';
}

/** The raw user id the cache is currently namespaced to ('' when anonymous). */
export function namespaceUserId(): string {
  return namespace.startsWith('u_') ? namespace.slice(2) : '';
}

function storageKey(key: string): string {
  return `${PREFIX}${namespace}.${key}`;
}

interface CacheEnvelope<T> {
  value: T;
  savedAt: number;
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { value, savedAt: Date.now() };
    await AsyncStorage.setItem(storageKey(key), JSON.stringify(envelope));
  } catch (error) {
    console.warn('cache write failed:', error);
  }
}

export async function readCache<T>(
  key: string,
  ttlMs: number = CACHE_TTL_MS,
): Promise<{ value: T; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (!envelope || typeof envelope.savedAt !== 'number') return null;
    if (Date.now() - envelope.savedAt > ttlMs) return null;
    return { value: envelope.value, savedAt: envelope.savedAt };
  } catch (error) {
    console.warn('cache read failed:', error);
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch (error) {
    console.warn('cache clear failed:', error);
  }
}

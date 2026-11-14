import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_TTL_MS } from '../config';

/**
 * Small TTL cache used to keep read-only screens usable in the field where
 * connectivity is intermittent. It stores the last successful JSON payload per
 * key and the time it was written. Cache entries are never presented as fresh
 * network data: callers receive a `fromCache` flag and the UI labels it.
 */

const PREFIX = 'agrogrowth.cache.';

interface CacheEnvelope<T> {
  value: T;
  savedAt: number;
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { value, savedAt: Date.now() };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch (error) {
    console.warn('cache write failed:', error);
  }
}

export async function readCache<T>(
  key: string,
  ttlMs: number = CACHE_TTL_MS,
): Promise<{ value: T; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
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

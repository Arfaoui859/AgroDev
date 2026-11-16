import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedAnalysis } from '../types';

const LEGACY_KEY = 'agrogrowth.history';
const MAX_ENTRIES = 50;
let historyUserId: string | null = null;

/** Select the private history namespace before reading or writing entries. */
export function setHistoryUserId(userId: string | null): void {
  historyUserId = userId;
}

/** Remove the pre-namespace shared key; it cannot safely be assigned to an account. */
export async function clearLegacyHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch (error) {
    console.warn('legacy history cleanup failed:', error);
  }
}

function historyKey(): string {
  return `agrogrowth.history.${historyUserId ? `u_${historyUserId}` : 'anon'}`;
}

/**
 * Local analysis history.
 *
 * There is no verified server-side history endpoint for mobile, so entries are
 * stored on the device only. They reflect analyses the user actually ran on
 * this device — nothing is seeded or invented.
 */
export async function getHistory(): Promise<SavedAnalysis[]> {
  try {
    const raw = await AsyncStorage.getItem(historyKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedAnalysis[]) : [];
  } catch (error) {
    console.warn('history read failed:', error);
    return [];
  }
}

export async function addHistoryEntry(entry: Omit<SavedAnalysis, 'id' | 'date'>): Promise<SavedAnalysis[]> {
  // Capture the namespace once. An account switch while AsyncStorage is
  // resolving must never redirect an in-flight write into the next account.
  const key = historyKey();
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing: SavedAnalysis[] = Array.isArray(parsed) ? parsed : [];
    const full: SavedAnalysis = {
      ...entry,
      id: `h_${Date.now()}`,
      date: new Date().toISOString(),
    };
    const next = [full, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn('history write failed:', error);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(historyKey());
  } catch (error) {
    console.warn('history clear failed:', error);
  }
}

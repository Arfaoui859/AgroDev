import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedAnalysis } from '../types';

const KEY = 'agrogrowth.history';
const MAX_ENTRIES = 50;

/**
 * Local analysis history.
 *
 * There is no verified server-side history endpoint for mobile, so entries are
 * stored on the device only. They reflect analyses the user actually ran on
 * this device — nothing is seeded or invented.
 */
export async function getHistory(): Promise<SavedAnalysis[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedAnalysis[]) : [];
  } catch (error) {
    console.warn('history read failed:', error);
    return [];
  }
}

export async function addHistoryEntry(entry: Omit<SavedAnalysis, 'id' | 'date'>): Promise<SavedAnalysis[]> {
  try {
    const existing = await getHistory();
    const full: SavedAnalysis = {
      ...entry,
      id: `h_${Date.now()}`,
      date: new Date().toISOString(),
    };
    const next = [full, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn('history write failed:', error);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.warn('history clear failed:', error);
  }
}

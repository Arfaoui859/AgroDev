import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local checklist state for a cultivation project's tasks.
 *
 * The tasks themselves are derived from the soil report (server-authored). Only
 * the "done" ticks live on the device — there is no verified server-side task
 * store for these, so we keep them local and say so in the UI rather than
 * pretending they are synced.
 */
const key = (cultivationId: string) => `agrogrowth.projectTasks.${cultivationId}`;

export async function getTaskState(cultivationId: string): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(key(cultivationId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export async function setTaskDone(
  cultivationId: string,
  taskId: string,
  done: boolean,
): Promise<Record<string, boolean>> {
  const current = await getTaskState(cultivationId);
  const next = { ...current, [taskId]: done };
  try {
    await AsyncStorage.setItem(key(cultivationId), JSON.stringify(next));
  } catch {
    /* non-fatal: the tick simply won't persist */
  }
  return next;
}

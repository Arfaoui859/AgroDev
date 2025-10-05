import { SupabaseClient } from '@supabase/supabase-js';

// Try inserting into a table; on PGRST204 remove missing columns and retry
export async function safeInsert(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, any>
) {
  let attemptPayload = { ...payload };

  while (true) {
    const { data, error } = await supabase.from(table).insert(attemptPayload);
    if (!error) return { data, error: null };

    // If error indicates missing column in schema cache, try to remove that column and retry
    if (error.code === 'PGRST204' && /Could not find the '\w+' column of/.test(error.message)) {
      const m = error.message.match(/Could not find the '(.+?)' column of/);
      if (m && m[1]) {
        const col = m[1];
        if (col in attemptPayload) {
          delete attemptPayload[col];
          continue; // retry without that column
        }
      }
    }

    return { data: null, error };
  }
}

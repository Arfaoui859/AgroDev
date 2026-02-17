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

    // Handle enum/role missing errors like: role "admin" does not exist
    if (typeof error.message === 'string') {
      const roleMatch = error.message.match(/role "(.+?)" does not exist/);
      if (roleMatch && roleMatch[1]) {
        const roleField = Object.keys(attemptPayload).find((k) => String(attemptPayload[k]) === roleMatch[1]);
        if (roleField) {
          delete attemptPayload[roleField];
          continue; // retry without role
        }
      }

      const enumMatch = error.message.match(/invalid input value for enum (\"|')?(.+?)(\"|')?:?\s*"?(.+?)"?/i);
      if (enumMatch) {
        const invalidValue = enumMatch[4] || enumMatch[2];
        const field = Object.keys(attemptPayload).find((k) => String(attemptPayload[k]) === invalidValue);
        if (field) {
          delete attemptPayload[field];
          continue;
        }
      }
    }

    return { data: null, error };
  }
}

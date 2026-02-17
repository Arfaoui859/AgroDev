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
    // Example message: "Could not find the 'location' column of 'users' in the schema cache"
    if (error.code === 'PGRST204' && /Could not find the '\w+' column of/.test(error.message)) {
      const m = error.message.match(/Could not find the '(.+?)' column of/);
      if (m && m[1]) {
        const col = m[1];
        // Remove the column and retry
        if (col in attemptPayload) {
          delete attemptPayload[col];
          // continue loop to retry
          continue;
        }
      }
    }

    // Handle enum/role missing errors like: role "admin" does not exist
    // or "invalid input value for enum" patterns
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
        // Try to remove offending field by scanning payload values
        const invalidValue = enumMatch[4] || enumMatch[2];
        const field = Object.keys(attemptPayload).find((k) => String(attemptPayload[k]) === invalidValue);
        if (field) {
          delete attemptPayload[field];
          continue;
        }
      }
    }

    // For any other error, return it
    return { data: null, error };
  }
}

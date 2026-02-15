import { supabase } from '../lib/supabase';

export async function verifyDatabaseTables() {
  console.log('🔍 Verifying database tables...');

  const errors: string[] = [];

  try {
    // Test users table
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table issue:', usersError.message);
      console.error('Error code:', usersError.code);
      console.error('Error details:', usersError.details);

      // Provide helpful diagnostic message
      if (usersError.message?.includes('relation') || usersError.message?.includes('does not exist')) {
        console.error(`
⚠️  DATABASE SETUP REQUIRED
═══════════════════════════════════════════════════════════
The 'users' table does not exist in your Supabase database.

📋 FIX:
1. Open your Supabase project dashboard at: https://app.supabase.com
2. Go to SQL Editor
3. Create a new query
4. Copy the contents of 'supabase-tables-setup.sql' file (in project root)
5. Run the query
6. Refresh the page

This will create the necessary tables with proper permissions.
═══════════════════════════════════════════════════════════
        `);
      } else if (usersError.message?.includes('permission denied')) {
        console.error(`
⚠️  PERMISSION DENIED
═══════════════════════════════════════════════════════════
RLS (Row Level Security) policies may be blocking access.

📋 FIX:
1. Check the RLS policies in Supabase dashboard
2. Ensure RLS allows authenticated users to read/write
3. Or run 'supabase-tables-setup.sql' to fix policies
═══════════════════════════════════════════════════════════
        `);
      }
      errors.push('Users table not accessible');
      return false;
    } else {
      console.log('✅ Users table exists and accessible');
    }

    // Test user_profiles table
    const { data: profilesTest, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.error('❌ User_profiles table issue:', profilesError.message);
      console.error('Error code:', profilesError.code);
      console.error('Error details:', profilesError.details);

      if (profilesError.message?.includes('relation') || profilesError.message?.includes('does not exist')) {
        console.error(`
⚠️  DATABASE SETUP REQUIRED
═══════════════════════════════════════════════════════════
The 'user_profiles' table does not exist in your Supabase database.
See fix instructions above (users table error).
═══════════════════════════════════════════════════════════
        `);
      }
      errors.push('User_profiles table not accessible');
      return false;
    } else {
      console.log('✅ User_profiles table exists and accessible');
    }

    if (errors.length === 0) {
      console.log('✅ All required tables are ready for real registration!');
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Database verification failed:', error);
    console.error('Error message:', error.message);
    return false;
  }
}

// Auto-run verification (but don't block on failure)
verifyDatabaseTables().catch(err => {
  console.warn('Database verification error (non-blocking):', err);
});

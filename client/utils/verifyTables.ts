import { supabase } from '../lib/supabase';

export async function verifyDatabaseTables() {
  console.log('🔍 Verifying database tables...');

  // Skip verification if Supabase is not configured
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - skipping database verification');
    return false;
  }

  const errors: string[] = [];

  try {
    // Add timeout to prevent hanging if service is unavailable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        clearTimeout(timeoutId);
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
        clearTimeout(timeoutId);
        return false;
      } else {
        console.log('✅ User_profiles table exists and accessible');
      }

      clearTimeout(timeoutId);

      if (errors.length === 0) {
        console.log('✅ All required tables are ready for real registration!');
        return true;
      }

      return false;
    } catch (innerError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors gracefully
      if (innerError.name === 'AbortError' || innerError.message?.includes('timeout')) {
        console.warn('⏱️ Database verification timed out - continuing without verification');
        console.warn('This usually means Supabase is temporarily unavailable or the network is slow');
        return true; // Don't block on timeout
      }
      
      throw innerError;
    }
  } catch (error: any) {
    console.error('❌ Database verification failed:', error);
    console.error('Error message:', error.message);
    
    // If it's a network error, log it but don't crash the app
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('offline')) {
      console.warn('⚠️ Network error during database verification - app will continue with limited functionality');
      return false;
    }
    
    return false;
  }
}

// Auto-run verification (but don't block on failure)
verifyDatabaseTables().catch(err => {
  console.warn('Database verification error (non-blocking):', err?.message || err);
});

import { supabase } from '../lib/supabase';

export async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...');

  try {
    // Test if users table exists and what columns it has
    console.log('Testing users table...');
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table error:');
      console.error('Message:', usersError.message || 'No message');
      console.error('Details:', usersError.details || 'No details');
      console.error('Hint:', usersError.hint || 'No hint');
      console.error('Code:', usersError.code || 'No code');

      if (usersError.message?.includes('relation') && usersError.message?.includes('does not exist')) {
        console.error(`
════════════════════════════════════════════════════════════════
🔍 DIAGNOSIS: Users table does not exist

💡 SOLUTION:
1. Go to Supabase dashboard: https://app.supabase.com
2. Navigate to SQL Editor
3. Run the script from 'supabase-tables-setup.sql'
4. Refresh your application

This will create the users and user_profiles tables with proper
RLS (Row Level Security) policies configured.
════════════════════════════════════════════════════════════════
        `);
      } else if (usersError.message?.includes('permission denied')) {
        console.error(`
════════════════════════════════════════════════════════════════
🔍 DIAGNOSIS: Permission denied (likely RLS policy issue)

💡 SOLUTION:
1. Check RLS policies in Supabase dashboard
2. Re-run 'supabase-tables-setup.sql' to fix policies
3. Or disable RLS for testing (not recommended for production)
════════════════════════════════════════════════════════════════
        `);
      }
    } else {
      console.log('✅ Users table accessible');
    }

    // Test if user_profiles table exists
    console.log('Testing user_profiles table...');
    const { data: profilesTest, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ User_profiles table error:');
      console.error('Message:', profilesError.message || 'No message');
      console.error('Details:', profilesError.details || 'No details');
      console.error('Hint:', profilesError.hint || 'No hint');
      console.error('Code:', profilesError.code || 'No code');
      if (profilesError.message?.includes('relation') && profilesError.message?.includes('does not exist')) {
        console.error('🔍 DIAGNOSIS: User_profiles table does not exist');
        console.error('💡 SOLUTION: Create the user_profiles table using the SQL setup files');
      }
    } else {
      console.log('✅ User_profiles table accessible');
    }

    // Test basic insert permissions
    console.log('Testing insert permissions...');
    const testUserId = 'test-user-id-' + Date.now();
    
    const { error: insertTestError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        full_name_ar: 'مستخدم تجريبي',
        role: 'farmer',
        verified: false
      });

    if (insertTestError) {
      console.error('❌ Insert permission error:');
      console.error('Error object:', insertTestError);
      console.error('Error message:', insertTestError.message || 'No message');
      console.error('Error details:', insertTestError.details || 'No details');
      console.error('Error hint:', insertTestError.hint || 'No hint');
      console.error('Error code:', insertTestError.code || 'No code');
      console.error('Full error JSON:', JSON.stringify(insertTestError, null, 2));

      // Check if it's a PostgreSQL error
      if (insertTestError.message) {
        if (insertTestError.message.includes('relation') && insertTestError.message.includes('does not exist')) {
          console.error('🔍 DIAGNOSIS: The "users" table does not exist in the database');
          console.error('💡 SOLUTION: Run the cloud-setup.sql and supabase-setup.sql files in your Supabase SQL editor');
        } else if (insertTestError.message.includes('permission denied') || insertTestError.message.includes('RLS')) {
          console.error('🔍 DIAGNOSIS: Row Level Security (RLS) is blocking the insert operation');
          console.error('💡 SOLUTION: Update RLS policies to allow inserts or disable RLS for testing');
        } else if (insertTestError.message.includes('violates')) {
          console.error('🔍 DIAGNOSIS: Data constraint violation (foreign key, unique, etc.)');
          console.error('💡 SOLUTION: Check table constraints and data format');
        }
      }
    } else {
      console.log('✅ Insert permissions working');
      
      // Clean up test record
      await supabase.from('users').delete().eq('id', testUserId);
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Auto-run test when imported
testDatabaseSchema();

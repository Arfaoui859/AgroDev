import { supabase } from '../lib/supabase';

export async function verifyDatabaseTables() {
  console.log('🔍 Verifying database tables...');
  
  try {
    // Test users table
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table issue:', usersError.message);
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
      return false;
    } else {
      console.log('✅ User_profiles table exists and accessible');
    }

    console.log('✅ All required tables are ready for real registration!');
    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}

// Auto-run verification
verifyDatabaseTables();

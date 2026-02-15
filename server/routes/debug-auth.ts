import { RequestHandler } from 'express';
import { supabase } from '../lib/supabase';

export const debugAuth: RequestHandler = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email parameter required'
      });
    }

    console.log('🔍 Debug auth for email:', email);

    // Test 1: Try to sign in to see what error we get
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email as string,
      password: 'test123' // Common test password
    });

    let result = {
      email,
      signInTest: {
        success: !signInError,
        error: signInError ? {
          message: signInError.message,
          status: signInError.status
        } : null
      }
    };

    // Test 2: Try with demo password
    const { data: demoSignInData, error: demoSignInError } = await supabase.auth.signInWithPassword({
      email: email as string,
      password: 'demo123' // Demo password
    });

    result = {
      ...result,
      demoPasswordTest: {
        success: !demoSignInError,
        error: demoSignInError ? {
          message: demoSignInError.message,
          status: demoSignInError.status
        } : null
      }
    };

    res.json({
      status: 'success',
      message: 'Auth debug completed',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Debug auth failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Debug auth failed',
      error: error.message
    });
  }
};

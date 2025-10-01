import { RequestHandler } from 'express';
import { supabase } from '../lib/supabase';

export const testAuthSignup: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password required'
      });
    }

    console.log('🧪 Testing Supabase Auth signup for:', email);

    // Test signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('❌ Auth signup error:', error);
      return res.status(400).json({
        status: 'error',
        message: error.message,
        error_details: error
      });
    }

    console.log('✅ Auth signup successful');

    res.json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user_id: data.user?.id,
        email: data.user?.email,
        email_confirmed: data.user?.email_confirmed_at,
        has_session: !!data.session,
        needs_confirmation: !data.session
      }
    });

  } catch (error: any) {
    console.error('❌ Auth test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Auth test failed',
      error: error.message
    });
  }
};

export const testAuthSignin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password required'
      });
    }

    console.log('🧪 Testing Supabase Auth signin for:', email);

    // Test signin
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Auth signin error:', error);
      return res.status(400).json({
        status: 'error',
        message: error.message,
        error_details: error
      });
    }

    console.log('✅ Auth signin successful');

    res.json({
      status: 'success',
      message: 'User signed in successfully',
      data: {
        user_id: data.user?.id,
        email: data.user?.email,
        email_confirmed: data.user?.email_confirmed_at,
        has_session: !!data.session
      }
    });

  } catch (error: any) {
    console.error('❌ Auth signin test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Auth signin test failed',
      error: error.message
    });
  }
};

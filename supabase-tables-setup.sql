-- =====================================================
-- AgroGrowth Platform - Supabase Tables Setup
-- =====================================================
-- Run this script in your Supabase SQL Editor:
-- 1. Go to https://app.supabase.com/projects/[PROJECT_ID]/sql/new
-- 2. Copy and paste this entire script
-- 3. Click "Run"

-- =====================================================
-- Enable Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Create Tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    full_name_ar VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'farmer',
    location VARCHAR(255),
    specialization TEXT,
    experience_years INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    bio_ar TEXT,
    farm_size_hectares DECIMAL(10,2),
    crops_grown TEXT[],
    certifications TEXT[],
    preferences JSONB DEFAULT '{"language": "ar", "notifications": true, "weather_alerts": true, "market_alerts": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for users table
-- =====================================================

-- Policy 1: Users can view their own record
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Authenticated users can update their own record
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Authenticated users can insert their own record during signup
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Service role (admin) can do everything
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all" ON public.users
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- RLS Policies for user_profiles table
-- =====================================================

-- Policy 1: Users can view their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.user_profiles;
CREATE POLICY "profiles_select_own" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.user_profiles;
CREATE POLICY "profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 3: Authenticated users can insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.user_profiles;
CREATE POLICY "profiles_insert_own" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 4: Service role (admin) can do everything
DROP POLICY IF EXISTS "profiles_admin_all" ON public.user_profiles;
CREATE POLICY "profiles_admin_all" ON public.user_profiles
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Create Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- =====================================================
-- Create Trigger Function for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create Triggers
-- =====================================================

-- Trigger for users table
DROP TRIGGER IF EXISTS on_users_updated ON public.users;
CREATE TRIGGER on_users_updated
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_profiles table
DROP TRIGGER IF EXISTS on_user_profiles_updated ON public.user_profiles;
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Grant Permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated, anon;

-- =====================================================
-- Verification
-- =====================================================
-- Tables should now exist. Query to verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('users', 'user_profiles');

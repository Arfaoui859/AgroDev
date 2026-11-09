-- Minimal Supabase-compatibility shim for validating RLS against a vanilla
-- Postgres 16 container. Supabase provides these objects; plain Postgres does
-- not. This file is ONLY for local/CI validation of database/cloud-setup.sql --
-- it is never applied to the real Supabase project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supabase's JWT-claim accessor. The real implementation reads
-- current_setting('request.jwt.claims'); this shim mirrors that contract so
-- policies written against auth.uid() behave identically.
-- Supabase Storage compatibility objects for the disposable CI database.
-- These mirror only the columns/functions referenced by RLS policies; they are
-- not a replacement for Supabase Storage and are never applied to production.
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id text NOT NULL,
  name text NOT NULL,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_id, name)
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(object_name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $
  SELECT CASE
    WHEN object_name IS NULL OR object_name = '' THEN ARRAY[]::text[]
    ELSE string_to_array(trim(both '/' from object_name), '/')[1:greatest(array_length(string_to_array(trim(both '/' from object_name), '/'), 1) - 1, 0)]
  END
$;

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS auth;

-- Minimal auth.users table for exercising the production signup trigger in CI.
-- Supabase owns the real table; this shim is isolated to the disposable test DB.
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_confirmed_at timestamptz
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ),
    ''
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'role',
    current_setting('request.jwt.claim.role', true),
    'anon'
  )
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb)
$$;

-- Supabase's request-role helper, used by some policies.
CREATE OR REPLACE FUNCTION auth.email() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claims', true)::json ->> 'email'
$$;

-- Roles the Supabase PostgREST layer switches into per request.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- Supabase grants anon/authenticated table privileges by default and relies on
-- RLS to restrict rows. Mirror that so a missing policy is what fails a test,
-- not a missing GRANT.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

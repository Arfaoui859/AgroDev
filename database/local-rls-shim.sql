-- Minimal Supabase-compatibility shim for validating RLS against a vanilla
-- Postgres 16 container. Supabase provides these objects; plain Postgres does
-- not. This file is ONLY for local/CI validation of database/cloud-setup.sql --
-- it is never applied to the real Supabase project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supabase's JWT-claim accessor. The real implementation reads
-- current_setting('request.jwt.claims'); this shim mirrors that contract so
-- policies written against auth.uid() behave identically.
CREATE SCHEMA IF NOT EXISTS auth;

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

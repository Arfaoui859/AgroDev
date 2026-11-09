-- ============================================================================
-- AgroGrowth — RLS verification suite
--
-- Proves database/cloud-setup.sql + database/rls-hardening.sql actually isolate
-- tenants, using real Postgres role switching (the same mechanism PostgREST
-- uses) rather than the privileged connection.
--
-- Run against a Supabase-compatible database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/db/rls-verification.sql
--
-- Every check raises an exception on failure, so a non-zero exit means RLS is
-- not enforcing what this file claims. Rows created here are cleaned up at the
-- end (test identities only).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assert_true(cond boolean, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: %', label;
  END IF;
  RAISE NOTICE 'ok - %', label;
END $$;

GRANT EXECUTE ON FUNCTION public.assert_true(boolean, text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fixtures: two farmers, one expert, one admin.
-- ---------------------------------------------------------------------------
DELETE FROM public.farms WHERE owner_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.user_profiles WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc');
DELETE FROM public.user_analytics WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.push_subscriptions WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.notifications WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.users WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc');

INSERT INTO public.users (id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'farmer.a@rls.test', 'Farmer A', 'farmer'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'farmer.b@rls.test', 'Farmer B', 'farmer'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'expert@rls.test',   'Expert',   'expert'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin@rls.test',    'Admin',    'admin');

INSERT INTO public.user_profiles (user_id, bio) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A bio'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B bio');

INSERT INTO public.farms (id, owner_id, name, location, size_hectares) VALUES
  ('f0000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Farm A', '{"lat":36.8,"lng":10.1}'::jsonb, 4.5),
  ('f0000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Farm B', '{"lat":34.7,"lng":10.7}'::jsonb, 2.0);

INSERT INTO public.weather_records (farm_id, location, record_date, source)
VALUES (
  'f0000000-0000-0000-0000-0000000000a1',
  '{"region":"test-private-farm"}'::jsonb,
  CURRENT_DATE,
  'rls-test'
);
INSERT INTO public.weather_forecasts (farm_id, forecast_date, forecast_data, source)
VALUES (
  'f0000000-0000-0000-0000-0000000000a1',
  CURRENT_DATE,
  '{"forecast":"private-test"}'::jsonb,
  'rls-test'
);

INSERT INTO public.farm_sections (id, farm_id, name, area_hectares) VALUES
  ('50000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-0000000000a1',
   'Section A1', 2.0);

INSERT INTO public.soil_analyses (id, farm_id, section_id, ph_level, analysis_type, sensor_data) VALUES
  ('50a00000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-0000000000a1',
   '50000000-0000-0000-0000-0000000000a1', 6.8, 'laboratory', '{"ph":6.8}'::jsonb);

INSERT INTO public.user_analytics (user_id, event_type) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'login');

INSERT INTO public.push_subscriptions (user_id, endpoint, keys) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://push.test/a', '{"p256dh":"k","auth":"a"}'::jsonb);

INSERT INTO public.notifications (user_id, title, message, type) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A notification', 'body', 'info');

DELETE FROM public.market_prices
WHERE crop_name = 'rls-test-tomato' AND market_location = 'RLS verification fixture';

INSERT INTO public.market_prices (crop_name, market_location, price_per_kg, price_date) VALUES
  ('rls-test-tomato', 'RLS verification fixture', 2.5, CURRENT_DATE);

-- ---------------------------------------------------------------------------
-- SCENARIO 1 — Farmer A: sees own data, never Farmer B's.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

SELECT public.assert_true((SELECT count(*) FROM public.users) = 1,
  'farmer A sees exactly one user row (self)');
SELECT public.assert_true((SELECT count(*) FROM public.user_profiles) = 1,
  'farmer A can read own user_profiles (previously denied: 0 rows)');
SELECT public.assert_true((SELECT count(*) FROM public.farms) = 1,
  'farmer A sees only own farm');
SELECT public.assert_true((SELECT name FROM public.farms) = 'Farm A',
  'the visible farm belongs to farmer A');
SELECT public.assert_true((SELECT count(*) FROM public.farm_sections) = 1,
  'farmer A sees own farm section');
SELECT public.assert_true((SELECT count(*) FROM public.soil_analyses) = 1,
  'farmer A sees own soil analysis');
SELECT public.assert_true((SELECT count(*) FROM public.weather_records) = 1,
  'farmer A sees only weather records linked to own farm');
SELECT public.assert_true((SELECT count(*) FROM public.weather_forecasts) = 1,
  'farmer A sees only forecasts linked to own farm');

-- The same owner-scoped policy must allow a real soil report insert.
INSERT INTO public.soil_analyses (farm_id, section_id, analysis_type, sensor_data, analysis_result)
VALUES (
  'f0000000-0000-0000-0000-0000000000a1',
  '50000000-0000-0000-0000-0000000000a1',
  'lab',
  '{"ph":6.5,"moisture":45}'::jsonb,
  '{"executiveSummary":"RLS insert test"}'::jsonb
);
SELECT public.assert_true((SELECT count(*) FROM public.soil_analyses) = 2,
  'farmer A can insert a soil analysis for their own farm');

-- pH is valid on the full 0–14 scale; DECIMAL(4,2) must store alkaline values.
INSERT INTO public.soil_analyses (
  farm_id, section_id, analysis_type, sensor_data, ph_level
) VALUES (
  'f0000000-0000-0000-0000-0000000000a1',
  '50000000-0000-0000-0000-0000000000a1',
  'lab',
  '{"ph":12.5}'::jsonb,
  12.5
);
SELECT public.assert_true(
  (SELECT ph_level = 12.5 FROM public.soil_analyses WHERE ph_level = 12.5),
  'soil_analyses stores valid alkaline pH values above 10'
);

-- A valid JWT must not permit a write to another farmer's farm.
DO $rls$
BEGIN
  BEGIN
    INSERT INTO public.soil_analyses (farm_id, analysis_type, sensor_data)
    VALUES (
      'f0000000-0000-0000-0000-0000000000b1',
      'lab',
      '{"ph":6.5}'::jsonb
    );
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A inserted a soil analysis for farmer B';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot insert soil analysis for farmer B (RLS denied)';
  END;
END $rls$;
SELECT public.assert_true((SELECT count(*) FROM public.notifications) = 1,
  'farmer A sees own notifications');
SELECT public.assert_true((SELECT count(*) FROM public.user_analytics) = 1,
  'farmer A sees own analytics');
SELECT public.assert_true((SELECT count(*) FROM public.push_subscriptions) = 1,
  'farmer A sees own push subscriptions');
SELECT public.assert_true((SELECT count(*) FROM public.market_prices) >= 1,
  'farmer A can read public market prices');
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 2 — Farmer B: cannot see any of Farmer A's rows.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

SELECT public.assert_true((SELECT count(*) FROM public.users) = 1,
  'farmer B sees only self, not farmer A');
SELECT public.assert_true((SELECT count(*) FROM public.user_profiles) = 1,
  'farmer B sees only own profile');
SELECT public.assert_true((SELECT count(*) FROM public.farms) = 1,
  'farmer B sees only own farm');
SELECT public.assert_true((SELECT count(*) FROM public.soil_analyses) = 0,
  'farmer B CANNOT see farmer A soil analyses (cross-tenant leak)');
SELECT public.assert_true((SELECT count(*) FROM public.weather_records) = 0,
  'farmer B cannot read farmer A weather records');
SELECT public.assert_true((SELECT count(*) FROM public.weather_forecasts) = 0,
  'farmer B cannot read farmer A weather forecasts');
SELECT public.assert_true((SELECT count(*) FROM public.farm_sections) = 0,
  'farmer B CANNOT see farmer A farm sections');
SELECT public.assert_true((SELECT count(*) FROM public.notifications) = 0,
  'farmer B CANNOT see farmer A notifications');
SELECT public.assert_true((SELECT count(*) FROM public.user_analytics) = 0,
  'farmer B CANNOT see farmer A analytics');
SELECT public.assert_true((SELECT count(*) FROM public.push_subscriptions) = 0,
  'farmer B CANNOT see farmer A push subscriptions');
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 3 — Anonymous: no access to private rows.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claims = '{"role":"anon"}';

SELECT public.assert_true((SELECT count(*) FROM public.user_analytics) = 0,
  'anonymous CANNOT read user_analytics (was world-readable)');
SELECT public.assert_true((SELECT count(*) FROM public.push_subscriptions) = 0,
  'anonymous CANNOT read push_subscriptions');
SELECT public.assert_true((SELECT count(*) FROM public.notifications) = 0,
  'anonymous CANNOT read notifications');
SELECT public.assert_true((SELECT count(*) FROM public.users) = 0,
  'anonymous CANNOT read users');
SELECT public.assert_true((SELECT count(*) FROM public.user_profiles) = 0,
  'anonymous CANNOT read user_profiles');
SELECT public.assert_true((SELECT count(*) FROM public.farms) = 0,
  'anonymous CANNOT read farms');
SELECT public.assert_true((SELECT count(*) FROM public.soil_analyses) = 0,
  'anonymous CANNOT read soil_analyses');
SELECT public.assert_true((SELECT count(*) FROM public.weather_records) = 0,
  'anonymous CANNOT read farm-linked weather records');
SELECT public.assert_true((SELECT count(*) FROM public.weather_forecasts) = 0,
  'anonymous CANNOT read farm-linked weather forecasts');
SELECT public.assert_true((SELECT count(*) FROM public.ai_service_logs) = 0,
  'anonymous CANNOT read ai_service_logs');
SELECT public.assert_true((SELECT count(*) FROM public.market_prices) >= 1,
  'anonymous CAN read public market prices (reference data)');
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 4 — Expert: read-only across farms, cannot write others' data.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","role":"authenticated"}';

SELECT public.assert_true((SELECT count(*) FROM public.farms) = 0,
  'expert cannot read farmer farms without an explicit consultation assignment');
SELECT public.assert_true((SELECT count(*) FROM public.soil_analyses) = 0,
  'expert cannot read soil analyses without an explicit consultation assignment');

DO $$
BEGIN
  BEGIN
    INSERT INTO public.farms (owner_id, name, location, size_hectares)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'expert-created', '{}'::jsonb, 1);
    RAISE EXCEPTION 'RLS CHECK FAILED: expert was able to create a farm';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - expert cannot write farms (RLS denied)';
  END;
END $$;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 5 — Admin: full access.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';

SELECT public.assert_true((SELECT count(*) FROM public.users) >= 4,
  'admin can read all users');
SELECT public.assert_true((SELECT count(*) FROM public.farms) >= 2,
  'admin can read all farms');
SELECT public.assert_true((SELECT count(*) FROM public.user_analytics) >= 1,
  'admin can read all analytics');
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 6 — Self-service signup path: a new user may insert their own rows.
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","role":"authenticated"}';

SELECT public.assert_true((SELECT count(*) FROM public.users) = 0,
  'a brand-new user starts with no visible rows');

INSERT INTO public.users (id, email, full_name, role)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'newbie@rls.test', 'Newbie', 'farmer');

INSERT INTO public.user_profiles (user_id, bio)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'new bio');

SELECT public.assert_true((SELECT count(*) FROM public.users) = 1,
  'new user can insert and then read own users row (signup path)');
SELECT public.assert_true((SELECT count(*) FROM public.user_profiles) = 1,
  'new user can insert and read own user_profiles row');

-- Self-service signup cannot grant a privileged role.
DO $rls$
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'role-escalation@rls.test', 'Escalation', 'admin');
    RAISE EXCEPTION 'RLS CHECK FAILED: new user self-assigned admin role';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - new user cannot self-assign admin role';
  END;

  BEGIN
    UPDATE public.users SET role = 'admin'
    WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    RAISE EXCEPTION 'RLS CHECK FAILED: user escalated own role';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - user cannot update own role';
  END;

  BEGIN
    UPDATE public.users SET email = 'attacker@rls.test'
    WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    RAISE EXCEPTION 'RLS CHECK FAILED: user changed own email';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - user cannot change own email';
  END;

  BEGIN
    UPDATE public.users SET is_active = false
    WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    RAISE EXCEPTION 'RLS CHECK FAILED: user changed own active status';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - user cannot change own active status';
  END;

  BEGIN
    UPDATE public.users SET email_verified = true
    WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    RAISE EXCEPTION 'RLS CHECK FAILED: user changed own email verification';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - user cannot change own email verification';
  END;

  BEGIN
    UPDATE public.users SET password_hash = 'attacker-controlled'
    WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    RAISE EXCEPTION 'RLS CHECK FAILED: user changed own password hash';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - user cannot change own password hash';
  END;

  BEGIN
    UPDATE public.users SET id = 'dddddddd-dddd-dddd-dddd-ddddddddddde'
    WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    RAISE EXCEPTION 'RLS CHECK FAILED: user changed own identity id';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - user cannot change own identity id';
  END;
END $rls$;


DO $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES ('99999999-9999-9999-9999-999999999999', 'spoof@rls.test', 'Spoof');
    RAISE EXCEPTION 'RLS CHECK FAILED: user was able to insert a row for another id';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - cannot insert a users row for a different id (RLS denied)';
  END;
END $$;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 7 — No policy recursion (a policy on users reading users).
-- ---------------------------------------------------------------------------
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';
SELECT public.assert_true(public.is_admin() IS TRUE,
  'is_admin() resolves without infinite recursion in policy context');
ROLLBACK;

-- Remove the uniquely named public reference-data fixture as well.
DELETE FROM public.market_prices
WHERE crop_name = 'rls-test-tomato' AND market_location = 'RLS verification fixture';

-- Cleanup test identities.
DELETE FROM public.farms WHERE owner_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.user_profiles WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.user_analytics WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.push_subscriptions WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.notifications WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM public.users WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc');

DROP FUNCTION IF EXISTS public.assert_true(boolean, text);

SELECT 'RLS verification completed: all checks passed' AS result;

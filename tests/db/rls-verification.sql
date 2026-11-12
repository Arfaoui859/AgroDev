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
DELETE FROM public.sensor_readings WHERE device_id IN (
  'e1000000-0000-0000-0000-0000000000a1',
  'e1000000-0000-0000-0000-0000000000b1');
DELETE FROM public.sensor_devices WHERE id IN (
  'e1000000-0000-0000-0000-0000000000a1',
  'e1000000-0000-0000-0000-0000000000b1');
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

DELETE FROM auth.users WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc');

INSERT INTO public.users (id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'farmer.a@rls.test', 'Farmer A', 'farmer'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'farmer.b@rls.test', 'Farmer B', 'farmer'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'expert@rls.test',   'Expert',   'expert'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin@rls.test',    'Admin',    'admin');

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'farmer.a@rls.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'farmer.b@rls.test'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'expert@rls.test'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin@rls.test')
ON CONFLICT (id) DO NOTHING;

-- Ensure the fixture has one profile row even in the lightweight auth shim.
-- The NOT EXISTS guard keeps this safe when the signup trigger already created it.
INSERT INTO public.user_profiles (user_id)
SELECT id
FROM auth.users
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.users.id
);


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

INSERT INTO public.farm_equipment (
  id, farm_id, name, category, created_by
) VALUES (
  '60000000-0000-0000-0000-0000000000a1',
  'f0000000-0000-0000-0000-0000000000a1',
  'Tractor A', 'tractor', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

INSERT INTO public.farm_tasks (
  id, farm_id, title, task_type, status, created_by, assigned_to
) VALUES (
  '70000000-0000-0000-0000-0000000000a1',
  'f0000000-0000-0000-0000-0000000000a1',
  'Irrigate section A1', 'irrigation', 'pending',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

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
SELECT public.assert_true((SELECT count(*) FROM public.farm_equipment) = 1,
  'farmer A sees own equipment');
SELECT public.assert_true((SELECT count(*) FROM public.farm_tasks) = 1,
  'farmer A sees own farm tasks');

DO $rls$
BEGIN
  BEGIN
    INSERT INTO public.farm_equipment (farm_id, name, created_by)
    VALUES ('f0000000-0000-0000-0000-0000000000b1', 'Foreign tractor', auth.uid());
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A inserted equipment into farmer B farm';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot insert equipment into farmer B farm';
  END;
  BEGIN
    INSERT INTO public.farm_tasks (farm_id, title, created_by, assigned_to)
    VALUES (
      'f0000000-0000-0000-0000-0000000000a1',
      'Spoofed creator task',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    );
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A spoofed task creator identity';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot spoof farm task creator identity';
  END;
END $rls$;
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
SELECT public.assert_true((SELECT count(*) FROM public.farm_equipment) = 0,
  'farmer B CANNOT see farmer A equipment');
SELECT public.assert_true((SELECT count(*) FROM public.farm_tasks) = 0,
  'farmer B CANNOT see farmer A farm tasks');
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
SELECT public.assert_true(NOT has_table_privilege('anon', 'public.farm_equipment', 'SELECT'),
  'anonymous has no SELECT privilege on farm equipment');
SELECT public.assert_true(NOT has_table_privilege('anon', 'public.farm_tasks', 'SELECT'),
  'anonymous has no SELECT privilege on farm tasks');
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

-- ---------------------------------------------------------------------------
-- SCENARIO 8 — signup + sync triggers keep the profile trustworthy.
-- Proves the production triggers on auth.users: a new user is provisioned as
-- farmer (a client-supplied role in metadata is ignored), and a later email
-- confirmation flips email_verified without any ability to downgrade trust.
-- ---------------------------------------------------------------------------
BEGIN;
DELETE FROM public.user_profiles WHERE user_id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888');
DELETE FROM public.users WHERE id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888');
DELETE FROM auth.users WHERE id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888');

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('77777777-7777-7777-7777-777777777777', 'new.farmer@rls.test', '{}'::jsonb),
  ('88888888-8888-8888-8888-888888888888', 'attacker@rls.test', '{"role":"admin"}'::jsonb);

SELECT public.assert_true(
  (SELECT role FROM public.users WHERE id = '77777777-7777-7777-7777-777777777777') = 'farmer',
  'new signup is provisioned as farmer');
SELECT public.assert_true(
  (SELECT email_verified FROM public.users WHERE id = '77777777-7777-7777-7777-777777777777') IS FALSE,
  'email_verified starts false before confirmation');
SELECT public.assert_true(
  (SELECT role FROM public.users WHERE id = '88888888-8888-8888-8888-888888888888') = 'farmer',
  'client-supplied admin role in metadata is ignored');

UPDATE auth.users
   SET email_confirmed_at = now(), last_sign_in_at = now()
 WHERE id = '77777777-7777-7777-7777-777777777777';
SELECT public.assert_true(
  (SELECT email_verified FROM public.users WHERE id = '77777777-7777-7777-7777-777777777777') IS TRUE,
  'email confirmation flips email_verified to true');
SELECT public.assert_true(
  (SELECT last_login FROM public.users WHERE id = '77777777-7777-7777-7777-777777777777') IS NOT NULL,
  'sign-in records last_login');

UPDATE auth.users
   SET email_confirmed_at = NULL, last_sign_in_at = NULL
 WHERE id = '77777777-7777-7777-7777-777777777777';
SELECT public.assert_true(
  (SELECT email_verified FROM public.users WHERE id = '77777777-7777-7777-7777-777777777777') IS TRUE,
  'sync trigger cannot downgrade email_verified');

DELETE FROM public.user_profiles WHERE user_id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888');
DELETE FROM public.users WHERE id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888');
DELETE FROM auth.users WHERE id IN (
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888');
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 9 — account deletion cascades (database/user-lifecycle.sql).
-- Deleting the auth.users row must remove the public.users profile, which in
-- turn cascades to that user's farms. Requires user-lifecycle.sql to be applied.
-- ---------------------------------------------------------------------------
BEGIN;
DELETE FROM public.farms WHERE owner_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.user_profiles WHERE user_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.users WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM auth.users WHERE id = '33333333-3333-3333-3333-333333333333';

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('33333333-3333-3333-3333-333333333333', 'delete.me@rls.test', '{}'::jsonb);
INSERT INTO public.farms (id, owner_id, name, location, size_hectares) VALUES
  ('f0000000-0000-0000-0000-0000000000c1',
   '33333333-3333-3333-3333-333333333333',
   'Delete Me Farm', '{"lat":36.8,"lng":10.1}'::jsonb, 1.0);

SELECT public.assert_true(
  (SELECT count(*) FROM public.users WHERE id = '33333333-3333-3333-3333-333333333333') = 1,
  'account exists before deletion');

DELETE FROM auth.users WHERE id = '33333333-3333-3333-3333-333333333333';

SELECT public.assert_true(
  (SELECT count(*) FROM public.users WHERE id = '33333333-3333-3333-3333-333333333333') = 0,
  'deleting the auth user removes the profile row');
SELECT public.assert_true(
  (SELECT count(*) FROM public.farms WHERE owner_id = '33333333-3333-3333-3333-333333333333') = 0,
  'deleting the auth user cascades to owned farms');

ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 10 — livestock records are tenant-scoped (database/livestock-persistence.sql).
-- Farmer A must see only their own animals/weights/health/feed, must not read
-- farmer B's animals, and must not be able to attach an animal to a farm they
-- do not own or spoof another user's ownership.
-- ---------------------------------------------------------------------------
BEGIN;
-- Fixtures (as the privileged owner, before switching roles).
DELETE FROM public.livestock_weight_records WHERE animal_id IN (
  'd2000000-0000-0000-0000-0000000000a1',
  'd2000000-0000-0000-0000-0000000000b1');
DELETE FROM public.livestock_health_events WHERE animal_id IN (
  'd2000000-0000-0000-0000-0000000000a1',
  'd2000000-0000-0000-0000-0000000000b1');
DELETE FROM public.livestock_reproduction_events WHERE animal_id IN (
  'd2000000-0000-0000-0000-0000000000a1',
  'd2000000-0000-0000-0000-0000000000b1');
DELETE FROM public.livestock_animals WHERE id IN (
  'd2000000-0000-0000-0000-0000000000a1',
  'd2000000-0000-0000-0000-0000000000b1');
DELETE FROM public.livestock_herds WHERE id IN (
  'd1000000-0000-0000-0000-0000000000a1',
  'd1000000-0000-0000-0000-0000000000b1');
DELETE FROM public.livestock_feed_inventory WHERE id = 'd3000000-0000-0000-0000-0000000000f1';

INSERT INTO public.livestock_herds (id, user_id, farm_id, name, species, purpose) VALUES
  ('d1000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'f0000000-0000-0000-0000-0000000000a1', 'Herd A', 'beef_cattle', 'beef'),
  ('d1000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'f0000000-0000-0000-0000-0000000000b1', 'Herd B', 'dairy_cattle', 'dairy');
INSERT INTO public.livestock_animals (id, user_id, farm_id, ear_tag, species, sex, health_status) VALUES
  ('d2000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'f0000000-0000-0000-0000-0000000000a1', 'TAG-A1', 'beef_cattle', 'female', 'good'),
  ('d2000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'f0000000-0000-0000-0000-0000000000b1', 'TAG-B1', 'dairy_cattle', 'female', 'good');
INSERT INTO public.livestock_weight_records (user_id, animal_id, weight_kg) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd2000000-0000-0000-0000-0000000000a1', 420),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd2000000-0000-0000-0000-0000000000b1', 510);
INSERT INTO public.livestock_feed_inventory (id, user_id, farm_id, feed_name, feed_type, quantity_kg) VALUES
  ('d3000000-0000-0000-0000-0000000000f1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'f0000000-0000-0000-0000-0000000000a1', 'Hay A', 'hay', 1000);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

SELECT public.assert_true((SELECT count(*) FROM public.livestock_animals) = 1,
  'farmer A sees only own animal');
SELECT public.assert_true((SELECT ear_tag FROM public.livestock_animals) = 'TAG-A1',
  'the visible animal belongs to farmer A');
SELECT public.assert_true((SELECT count(*) FROM public.livestock_weight_records) = 1,
  'farmer A sees only own weight records');
SELECT public.assert_true((SELECT count(*) FROM public.livestock_feed_inventory) = 1,
  'farmer A sees only own feed inventory');

DO $livestock$
BEGIN
  -- Cannot read farmer B's animal directly.
  PERFORM 1 FROM public.livestock_animals WHERE id = 'd2000000-0000-0000-0000-0000000000b1';
  IF FOUND THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A can read farmer B animal';
  END IF;
  RAISE NOTICE 'ok - farmer A cannot read farmer B animal';

  -- Cannot attach an animal to a farm they do not own.
  BEGIN
    INSERT INTO public.livestock_animals (user_id, farm_id, ear_tag, species, sex)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0000000-0000-0000-0000-0000000000b1',
            'TAG-A-FOREIGN', 'beef_cattle', 'male');
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A attached animal to farmer B farm';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot attach an animal to farmer B farm';
  END;

  -- Cannot spoof ownership.
  BEGIN
    INSERT INTO public.livestock_animals (user_id, ear_tag, species, sex)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TAG-SPOOF', 'beef_cattle', 'male');
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A spoofed animal ownership';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot spoof animal ownership';
  END;

  -- Cannot write a weight record against farmer B's animal.
  BEGIN
    INSERT INTO public.livestock_weight_records (user_id, animal_id, weight_kg)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd2000000-0000-0000-0000-0000000000b1', 500);
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A wrote a weight for farmer B animal';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot write weights for farmer B animal';
  END;
END $livestock$;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 11 — sensor registry is tenant-scoped (sensor_devices / sensor_readings).
-- Farmer A must see only their own farm's devices and readings, must not see
-- farmer B's, and must not attach a device to a farm they do not own.
-- ---------------------------------------------------------------------------
BEGIN;
DELETE FROM public.sensor_readings WHERE device_id IN (
  'e1000000-0000-0000-0000-0000000000a1',
  'e1000000-0000-0000-0000-0000000000b1');
DELETE FROM public.sensor_devices WHERE id IN (
  'e1000000-0000-0000-0000-0000000000a1',
  'e1000000-0000-0000-0000-0000000000b1');
INSERT INTO public.sensor_devices (id, farm_id, device_id, device_type, location) VALUES
  ('e1000000-0000-0000-0000-0000000000a1', 'f0000000-0000-0000-0000-0000000000a1',
   'SENS-A-1', 'soil_sensor', '{"lat":36.8,"lng":10.1}'::jsonb),
  ('e1000000-0000-0000-0000-0000000000b1', 'f0000000-0000-0000-0000-0000000000b1',
   'SENS-B-1', 'soil_sensor', '{"lat":34.7,"lng":10.7}'::jsonb);
INSERT INTO public.sensor_readings (device_id, reading_type, value, unit, recorded_at) VALUES
  ('e1000000-0000-0000-0000-0000000000a1', 'soil_ph', 6.8, 'pH', NOW()),
  ('e1000000-0000-0000-0000-0000000000b1', 'soil_ph', 7.4, 'pH', NOW());
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
SET LOCAL ROLE authenticated;

DO $sensor$
BEGIN
  IF (SELECT count(*) FROM public.sensor_devices) <> 1 THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A sees % devices', (SELECT count(*) FROM public.sensor_devices);
  END IF;
  RAISE NOTICE 'ok - farmer A sees only their own sensor device';

  IF EXISTS (SELECT 1 FROM public.sensor_devices WHERE device_id = 'SENS-B-1') THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A can see farmer B device';
  END IF;
  RAISE NOTICE 'ok - farmer A cannot see farmer B device';

  IF (SELECT count(*) FROM public.sensor_readings) <> 1 THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A sees % readings', (SELECT count(*) FROM public.sensor_readings);
  END IF;
  RAISE NOTICE 'ok - farmer A sees only readings from their own device';

  BEGIN
    INSERT INTO public.sensor_devices (farm_id, device_id, device_type, location)
    VALUES ('f0000000-0000-0000-0000-0000000000b1', 'SENS-A-X', 'soil_sensor', '{}'::jsonb);
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A attached a device to farmer B farm';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot attach a device to farmer B farm';
  END;
END $sensor$;
ROLLBACK;

-- ---------------------------------------------------------------------------
-- SCENARIO 12 — budget plans are tenant-scoped (database/budget-planning-persistence.sql).
-- Farmer A must see only their own plans and must not attach a plan to farmer
-- B's farm or read farmer B's plan.
-- ---------------------------------------------------------------------------
BEGIN;
DELETE FROM public.farm_budget_plans WHERE id IN (
  'b1000000-0000-0000-0000-0000000000a1',
  'b1000000-0000-0000-0000-0000000000b1');
INSERT INTO public.farm_budget_plans (id, user_id, crop_type, season_year, planned_area_hectares) VALUES
  ('b1000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tomato', 2026, 2.5),
  ('b1000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'olive', 2026, 5.0);
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
SET LOCAL ROLE authenticated;
DO $budget$
BEGIN
  IF (SELECT count(*) FROM public.farm_budget_plans) <> 1 THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A sees % budget plans', (SELECT count(*) FROM public.farm_budget_plans);
  END IF;
  RAISE NOTICE 'ok - farmer A sees only their own budget plan';

  BEGIN
    INSERT INTO public.farm_budget_plans (user_id, farm_id, crop_type, season_year, planned_area_hectares)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f0000000-0000-0000-0000-0000000000b1', 'wheat', 2026, 1.0);
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A attached a budget plan to farmer B farm';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot attach a budget plan to farmer B farm';
  END;

  BEGIN
    INSERT INTO public.farm_budget_plans (user_id, crop_type, season_year, planned_area_hectares)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'wheat', 2026, 1.0);
    RAISE EXCEPTION 'RLS CHECK FAILED: farmer A wrote a plan owned by farmer B';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - farmer A cannot spoof another owner on a budget plan';
  END;
END $budget$;
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

-- Verify per-user RLS on effectiveness reports.
-- Run after database/effectiveness-reports.sql and tests/db/rls-verification.sql.

DO $$
DECLARE
  rel_oid oid;
BEGIN
  SELECT c.oid INTO rel_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'effectiveness_reports';

  IF rel_oid IS NULL THEN
    RAISE EXCEPTION 'effectiveness_reports table is missing';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = rel_oid) THEN
    RAISE EXCEPTION 'RLS is not enabled on effectiveness_reports';
  END IF;
END $$;

DELETE FROM public.effectiveness_reports
WHERE user_id IN (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);
DELETE FROM public.users
WHERE id IN (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

INSERT INTO public.users (id, email, full_name, role) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'report-a@rls.test', 'Report A', 'farmer'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'report-b@rls.test', 'Report B', 'farmer');

INSERT INTO public.effectiveness_reports (user_id, report) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '{"applicationId":"a","effectivenessScore":70}'::jsonb),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"applicationId":"b","effectivenessScore":80}'::jsonb);

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","role":"authenticated"}';
DO $$
BEGIN
  IF (SELECT count(*) FROM public.effectiveness_reports) <> 1 THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: report user A must see only their own report';
  END IF;
  BEGIN
    INSERT INTO public.effectiveness_reports (user_id, report)
    VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"applicationId":"cross-user"}'::jsonb);
    RAISE EXCEPTION 'RLS CHECK FAILED: report user A inserted a row for user B';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok - report user A cannot insert for user B';
  END;
END $$;
ROLLBACK;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","role":"authenticated"}';
DO $$
BEGIN
  IF (SELECT count(*) FROM public.effectiveness_reports) <> 1 THEN
    RAISE EXCEPTION 'RLS CHECK FAILED: report user B must see only their own report';
  END IF;
END $$;
ROLLBACK;

DELETE FROM public.effectiveness_reports
WHERE user_id IN (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);
DELETE FROM public.users
WHERE id IN (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

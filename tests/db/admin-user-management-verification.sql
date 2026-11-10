-- Admin JWT can list all users; ordinary users remain tenant-scoped.
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'public.users table is missing';
  END IF;
END $$;

DELETE FROM public.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

INSERT INTO public.users (id,email,full_name,role,is_active,status) VALUES
 ('11111111-1111-1111-1111-111111111111','admin-rls-check@example.test','RLS Admin','admin',true,'active'),
 ('22222222-2222-2222-2222-222222222222','user-rls-check@example.test','RLS User','farmer',true,'active');

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
DO $$
BEGIN
  IF (SELECT count(*) FROM public.users WHERE email LIKE '%-rls-check@example.test') <> 2 THEN
    RAISE EXCEPTION 'Admin JWT must be able to list both admin and ordinary user records';
  END IF;
  UPDATE public.users SET status='suspended',is_active=false
  WHERE id='22222222-2222-2222-2222-222222222222';
  IF (SELECT status FROM public.users WHERE id='22222222-2222-2222-2222-222222222222') <> 'suspended' THEN
    RAISE EXCEPTION 'Admin JWT must be able to update another user status';
  END IF;
END $$;
ROLLBACK;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
DO $$
BEGIN
  IF (SELECT count(*) FROM public.users WHERE email LIKE '%-rls-check@example.test') <> 1 THEN
    RAISE EXCEPTION 'Ordinary user must not see another user record';
  END IF;
END $$;
ROLLBACK;

DELETE FROM public.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- RLS regression checks (run in a Supabase test/staging database).
-- These assertions intentionally use the application's canonical roles.
DO $$
DECLARE r text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO r
  FROM pg_constraint
  WHERE conname = 'profiles_role_check' AND conrelid = 'public.profiles'::regclass;
  IF r IS NULL THEN RAISE EXCEPTION 'profiles role constraint is missing'; END IF;
  IF r NOT ILIKE '%owner%' OR r NOT ILIKE '%admin%' OR r NOT ILIKE '%finance%' OR r NOT ILIKE '%staff%' OR r NOT ILIKE '%viewer%' THEN
    RAISE EXCEPTION 'profiles role constraint does not contain all canonical roles: %', r;
  END IF;
END $$;

-- Policy inventory smoke test: every tenant-owned table must have RLS enabled.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(t, ', ') INTO missing
  FROM unnest(ARRAY['organizations','profiles','customers','products','invoices','invoice_items','payments']) t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=t AND c.relrowsecurity
  );
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'RLS disabled on: %', missing; END IF;
END $$;

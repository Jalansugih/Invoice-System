-- Run this entire script in TWO separate PostgreSQL sessions at the same time.
-- Set app.test_user_id to the same test user used by 01_setup.sql in each session.
BEGIN;
SET LOCAL statement_timeout = '15s';
SELECT set_config('request.jwt.claim.sub', current_setting('app.test_user_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
DECLARE
  v_invoice uuid;
  v_bank uuid;
  v_result jsonb;
BEGIN
  SELECT invoice_id, bank_id INTO v_invoice, v_bank
  FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest';
  IF v_invoice IS NULL THEN RAISE EXCEPTION 'No concurrency fixture'; END IF;

  BEGIN
    v_result := public.record_payment_atomic(
      v_invoice,1000000,CURRENT_DATE,'bank_transfer','Concurrency Test Bank',v_bank,
      NULL,'CONC-RACE-'||substr(gen_random_uuid()::text,1,12),'concurrent full-balance payment'
    );
    RAISE NOTICE 'PAYMENT RACE SUCCESS: %', v_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PAYMENT RACE EXPECTED/FAILED CLIENT RESULT: %', SQLERRM;
  END;
END $$;
COMMIT;

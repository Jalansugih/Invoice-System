-- pgbench custom script. Replace TEST_USER_ID or set it with -Dtest_user_id='uuid'.
\set user_id 'TEST_USER_ID'
BEGIN;
SELECT set_config('request.jwt.claim.sub', :'user_id', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT invoice_id, bank_id FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest' \gset
SELECT public.record_payment_atomic(:invoice_id,1000000,CURRENT_DATE,'bank_transfer','Concurrency Test Bank',:bank_id,NULL,'PGB-RACE-' || substr(gen_random_uuid()::text,1,12),'pgbench concurrent payment');
COMMIT;

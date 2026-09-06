\set user_id 'TEST_USER_ID'
BEGIN;
SELECT set_config('request.jwt.claim.sub', :'user_id', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT customer_id, bank_id, product_id, invoice_number FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest' \gset
SELECT public.create_invoice_atomic(gen_random_uuid(),:invoice_number,:customer_id,CURRENT_DATE,CURRENT_DATE+7,NULL,NULL,'pgbench invoice race','7 hari','fixed',0,0,0,:bank_id,'unpaid',jsonb_build_array(jsonb_build_object('productId',:product_id,'quantity',1,'unitPrice',100000,'discount',0,'taxRate',0,'description','pgbench race')));
COMMIT;

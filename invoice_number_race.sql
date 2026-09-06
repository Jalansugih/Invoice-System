-- Run this entire script in TWO separate PostgreSQL sessions at the same time.
-- Both sessions intentionally use the SAME invoice number.
BEGIN;
SET LOCAL statement_timeout = '15s';
SELECT set_config('request.jwt.claim.sub', current_setting('app.test_user_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
DECLARE
  v_org uuid;
  v_user uuid;
  v_customer uuid;
  v_bank uuid;
  v_product uuid;
  v_invoice_no text;
  v_result jsonb;
BEGIN
  SELECT organization_id,user_id,customer_id,bank_id,product_id,invoice_number
  INTO v_org,v_user,v_customer,v_bank,v_product,v_invoice_no
  FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest';

  BEGIN
    v_result := public.create_invoice_atomic(
      gen_random_uuid(),v_invoice_no,v_customer,CURRENT_DATE,CURRENT_DATE+7,
      NULL,NULL,'invoice number race','7 hari','fixed',0,0,0,v_bank,'unpaid',
      jsonb_build_array(jsonb_build_object('productId',v_product,'quantity',1,'unitPrice',100000,'discount',0,'taxRate',0,'description','Race invoice'))
    );
    RAISE NOTICE 'INVOICE NUMBER RACE SUCCESS: %', v_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'INVOICE NUMBER RACE EXPECTED/FAILED CLIENT RESULT: %', SQLERRM;
  END;
END $$;
COMMIT;

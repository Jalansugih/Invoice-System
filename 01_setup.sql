-- BillingFlow concurrency fixture setup.
-- Replace TEST_USER_ID with a real profile/user UUID from the target test organization.
-- Run as a trusted test operator. This script intentionally COMMITs fixtures so two
-- independent sessions can see and race on the same invoice.

BEGIN;

DO $$
DECLARE
  v_user UUID := NULLIF(current_setting('app.test_user_id', true), '')::uuid;
  v_org UUID;
  v_customer UUID := gen_random_uuid();
  v_bank UUID := gen_random_uuid();
  v_product UUID := gen_random_uuid();
  v_invoice UUID := gen_random_uuid();
  v_invoice_no text := 'CONC-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Set app.test_user_id to a real test profile UUID before running setup';
  END IF;
  SELECT organization_id INTO v_org FROM public.profiles WHERE id=v_user;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Test user has no organization'; END IF;

  INSERT INTO public.customers(id,organization_id,code,name)
  VALUES(v_customer,v_org,'CONC-'||substr(v_customer::text,1,8),'Concurrency Test Customer');

  INSERT INTO public.bank_accounts(id,organization_id,bank_name,account_number,account_holder,branch,is_default)
  VALUES(v_bank,v_org,'Concurrency Test Bank','CONC-'||substr(v_bank::text,1,8),'TEST','TEST',false);

  INSERT INTO public.products(id,organization_id,code,name,unit,price,tax_rate,is_active,track_inventory,stock_qty,cost_price)
  VALUES(v_product,v_org,'CONC-'||substr(v_product::text,1,8),'Concurrency Test Product','Unit',100000,0,true,false,0,0);

  -- 1,000,000 total. Two sessions will each attempt 1,000,000.
  PERFORM public.create_invoice_atomic(
    v_invoice,v_invoice_no,v_customer,CURRENT_DATE,CURRENT_DATE+7,
    NULL,NULL,'Concurrency payment fixture','7 hari','fixed',0,0,0,v_bank,'unpaid',
    jsonb_build_array(jsonb_build_object('productId',v_product,'quantity',10,'unitPrice',100000,'discount',0,'taxRate',0,'description','Concurrency fixture'))
  );

  -- Store fixture identifiers in a dedicated temp-independent table only if present.
  CREATE TABLE IF NOT EXISTS public.billingflow_concurrency_test_fixtures(
    test_key text primary key,
    organization_id uuid not null,
    user_id uuid not null,
    customer_id uuid not null,
    bank_id uuid not null,
    product_id uuid not null,
    invoice_id uuid not null,
    invoice_number text not null,
    created_at timestamptz not null default now()
  );

  INSERT INTO public.billingflow_concurrency_test_fixtures
  VALUES('latest',v_org,v_user,v_customer,v_bank,v_product,v_invoice,v_invoice_no,now())
  ON CONFLICT (test_key) DO UPDATE SET
    organization_id=excluded.organization_id,user_id=excluded.user_id,customer_id=excluded.customer_id,
    bank_id=excluded.bank_id,product_id=excluded.product_id,invoice_id=excluded.invoice_id,
    invoice_number=excluded.invoice_number,created_at=excluded.created_at;

  RAISE NOTICE 'CONCURRENCY FIXTURE: user=% org=% customer=% bank=% product=% invoice=% invoice_number=%',
    v_user,v_org,v_customer,v_bank,v_product,v_invoice,v_invoice_no;
END $$;

COMMIT;

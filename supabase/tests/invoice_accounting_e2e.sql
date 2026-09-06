-- BILLINGFLOW: automated invoice + accounting E2E regression tests
-- Run AFTER all production migrations, especially v24.
-- Safe by default: the E2E fixture is wrapped in a transaction and rolled back.
-- Execute in Supabase SQL Editor / psql with sufficient privileges.
--
-- The script uses an existing public.profile as the authenticated test identity.
-- No production rows are intentionally committed.

BEGIN;

DO $$
DECLARE
  v_user UUID;
  v_org UUID;
  v_customer UUID := gen_random_uuid();
  v_product UUID := gen_random_uuid();
  v_bank UUID := gen_random_uuid();
  v_invoice UUID := gen_random_uuid();
  v_payment JSONB;
  v_inv JSONB;
  v_journal UUID;
  v_hpp UUID;
  v_before_stock NUMERIC;
  v_after_stock NUMERIC;
  v_paid NUMERIC;
  v_outstanding NUMERIC;
  v_debit NUMERIC;
  v_credit NUMERIC;
  v_revenue NUMERIC;
  v_ar NUMERIC;
  v_vat NUMERIC;
  v_cash NUMERIC;
  v_has_reversal BOOLEAN;
  v_count INTEGER;
BEGIN
  -- -----------------------------------------------------------------------
  -- 0. Preflight
  -- -----------------------------------------------------------------------
  SELECT p.id, p.organization_id INTO v_user, v_org
  FROM public.profiles p
  WHERE p.organization_id IS NOT NULL
  ORDER BY p.created_at
  LIMIT 1;

  IF v_user IS NULL OR v_org IS NULL THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: no profile with organization_id exists';
  END IF;

  IF to_regprocedure('public.create_invoice_atomic(uuid,character varying,uuid,date,date,character varying,character varying,text,character varying,character varying,numeric,numeric,numeric,uuid,character varying,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: create_invoice_atomic is missing';
  END IF;
  IF to_regprocedure('public.record_payment_atomic(uuid,numeric,date,character varying,character varying,uuid,character varying,character varying,text)') IS NULL THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: record_payment_atomic is missing';
  END IF;
  IF to_regprocedure('public.post_invoice_inventory(uuid)') IS NULL THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: post_invoice_inventory is missing';
  END IF;

  -- Simulate an authenticated request for the selected test profile.
  PERFORM set_config('request.jwt.claim.sub', v_user::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Required ledger accounts.
  PERFORM public.ensure_default_accounts();

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE organization_id=v_org AND code='1-2000') THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: AR account 1-2000 missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE organization_id=v_org AND code='4-1000') THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: revenue account 4-1000 missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE organization_id=v_org AND code='2-1100') THEN
    RAISE EXCEPTION 'TEST PREFLIGHT FAILED: VAT account 2-1100 missing';
  END IF;

  -- -----------------------------------------------------------------------
  -- 1. Fixture data (all rolled back at end)
  -- -----------------------------------------------------------------------
  INSERT INTO public.customers(
    id,organization_id,code,name,company_name,email,phone,address,pic
  ) VALUES (
    v_customer,v_org,'TEST-E2E-'||substr(v_customer::text,1,8),'E2E Customer',
    'E2E Customer PT','e2e@example.invalid','0800000000','Test Address','E2E'
  );

  -- track_inventory requires v16 schema.
  INSERT INTO public.products(
    id,organization_id,code,name,category,unit,price,tax_rate,is_active,
    track_inventory,stock_qty,cost_price
  ) VALUES (
    v_product,v_org,'TEST-E2E-'||substr(v_product::text,1,8),'E2E Product','Test',
    'Unit',100000,11,true,true,10,60000
  );

  INSERT INTO public.bank_accounts(
    id,organization_id,bank_name,account_number,account_holder,branch,is_default
  ) VALUES (
    v_bank,v_org,'TEST BANK','E2E-'||substr(v_bank::text,1,8),'E2E','TEST',false
  );

  SELECT stock_qty INTO v_before_stock FROM public.products WHERE id=v_product;

  -- -----------------------------------------------------------------------
  -- 2. CREATE invoice: 2 x 100k, 11% VAT, expected 222k.
  -- -----------------------------------------------------------------------
  v_inv := public.create_invoice_atomic(
    v_invoice,
    'TEST-E2E-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),
    v_customer,
    CURRENT_DATE,
    CURRENT_DATE + 14,
    NULL,NULL,'E2E regression test','14 hari',
    'fixed',0,11,0,v_bank,'unpaid',
    jsonb_build_array(jsonb_build_object(
      'productId',v_product,'quantity',2,'unitPrice',100000,
      'discount',0,'taxRate',11,'description','E2E Product'
    ))
  );

  IF (v_inv->>'grand_total')::NUMERIC <> 222000 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: expected grand_total 222000, got %', v_inv->>'grand_total';
  END IF;
  IF (v_inv->>'outstanding_amount')::NUMERIC <> 222000 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: expected outstanding 222000';
  END IF;

  SELECT stock_qty INTO v_after_stock FROM public.products WHERE id=v_product;
  IF v_after_stock <> v_before_stock - 2 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: stock expected %, got %', v_before_stock-2, v_after_stock;
  END IF;

  SELECT id INTO v_journal FROM public.journal_entries
  WHERE organization_id=v_org AND reference_type='invoice' AND reference_id=v_invoice AND status='POSTED'
  ORDER BY created_at DESC LIMIT 1;
  IF v_journal IS NULL THEN RAISE EXCEPTION 'TEST 2 FAILED: invoice journal missing'; END IF;

  SELECT COALESCE(SUM(debit),0),COALESCE(SUM(credit),0) INTO v_debit,v_credit
  FROM public.journal_lines WHERE journal_entry_id=v_journal;
  IF v_debit <> v_credit OR v_debit <> 222000 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: invoice journal unbalanced debit=% credit=%',v_debit,v_credit;
  END IF;

  SELECT COALESCE(SUM(jl.debit),0) INTO v_ar FROM public.journal_lines jl
  JOIN public.accounts a ON a.id=jl.account_id WHERE jl.journal_entry_id=v_journal AND a.code='1-2000';
  SELECT COALESCE(SUM(jl.credit),0) INTO v_revenue FROM public.journal_lines jl
  JOIN public.accounts a ON a.id=jl.account_id WHERE jl.journal_entry_id=v_journal AND a.code='4-1000';
  SELECT COALESCE(SUM(jl.credit),0) INTO v_vat FROM public.journal_lines jl
  JOIN public.accounts a ON a.id=jl.account_id WHERE jl.journal_entry_id=v_journal AND a.code='2-1100';
  IF v_ar<>222000 OR v_revenue<>200000 OR v_vat<>22000 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: AR=% revenue=% VAT=%',v_ar,v_revenue,v_vat;
  END IF;

  SELECT id INTO v_hpp FROM public.journal_entries
  WHERE organization_id=v_org AND reference_type='inventory_sale' AND reference_id=v_invoice AND status='POSTED'
  ORDER BY created_at DESC LIMIT 1;
  IF v_hpp IS NULL THEN RAISE EXCEPTION 'TEST 2 FAILED: inventory/HPP journal missing'; END IF;

  -- -----------------------------------------------------------------------
  -- 3. PARTIAL PAYMENT: 100k => paid 100k, outstanding 122k.
  -- -----------------------------------------------------------------------
  v_payment := public.record_payment_atomic(
    v_invoice,100000,CURRENT_DATE,'bank_transfer','TEST BANK',v_bank,
    NULL,'E2E-PAY-1','E2E partial payment'
  );

  SELECT paid_amount,outstanding_amount INTO v_paid,v_outstanding
  FROM public.invoices WHERE id=v_invoice;
  IF v_paid<>100000 OR v_outstanding<>122000 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: paid=% outstanding=%',v_paid,v_outstanding;
  END IF;

  SELECT id INTO v_journal FROM public.journal_entries
  WHERE organization_id=v_org AND reference_type='payment' AND reference_id=(v_payment->>'payment_id')::UUID AND status='POSTED';
  IF v_journal IS NULL THEN RAISE EXCEPTION 'TEST 3 FAILED: payment journal missing'; END IF;
  SELECT COALESCE(SUM(debit),0),COALESCE(SUM(credit),0) INTO v_debit,v_credit FROM public.journal_lines WHERE journal_entry_id=v_journal;
  IF v_debit<>v_credit OR v_debit<>100000 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: payment journal unbalanced debit=% credit=%',v_debit,v_credit;
  END IF;
  SELECT COALESCE(SUM(jl.debit),0) INTO v_cash FROM public.journal_lines jl
  JOIN public.accounts a ON a.id=jl.account_id WHERE jl.journal_entry_id=v_journal AND a.code <> '1-2000';
  IF v_cash<>100000 THEN RAISE EXCEPTION 'TEST 3 FAILED: cash/bank debit expected 100000, got %',v_cash; END IF;

  -- -----------------------------------------------------------------------
  -- 4. FINAL PAYMENT: 122k => paid and outstanding zero.
  -- -----------------------------------------------------------------------
  v_payment := public.record_payment_atomic(
    v_invoice,122000,CURRENT_DATE,'bank_transfer','TEST BANK',v_bank,
    NULL,'E2E-PAY-2','E2E final payment'
  );
  SELECT paid_amount,outstanding_amount,status INTO v_paid,v_outstanding,v_count
  FROM public.invoices WHERE id=v_invoice;
  IF v_paid<>222000 OR v_outstanding<>0 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: paid=% outstanding=%',v_paid,v_outstanding;
  END IF;
  IF (SELECT status FROM public.invoices WHERE id=v_invoice) <> 'paid' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: invoice is not paid';
  END IF;

  -- Two posted payment journals, each balanced.
  SELECT COUNT(*) INTO v_count FROM public.journal_entries
  WHERE organization_id=v_org AND reference_type='payment'
    AND reference_id IN (
      (SELECT id FROM public.payments WHERE invoice_id=v_invoice ORDER BY created_at LIMIT 1),
      (SELECT id FROM public.payments WHERE invoice_id=v_invoice ORDER BY created_at DESC LIMIT 1)
    ) AND status='POSTED';
  IF v_count<>2 THEN RAISE EXCEPTION 'TEST 4 FAILED: expected 2 payment journals, got %',v_count; END IF;

  -- -----------------------------------------------------------------------
  -- 5. MIXED TAX REGRESSION: 100k @11% + 100k @0% = 211k.
  -- -----------------------------------------------------------------------
  v_invoice := gen_random_uuid();
  v_inv := public.create_invoice_atomic(
    v_invoice,
    'TEST-MIXED-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),
    v_customer,CURRENT_DATE,CURRENT_DATE+14,NULL,NULL,NULL,NULL,
    'fixed',0,11,0,v_bank,'unpaid',
    jsonb_build_array(
      jsonb_build_object('quantity',1,'unitPrice',100000,'discount',0,'taxRate',11,'description','Taxable'),
      jsonb_build_object('quantity',1,'unitPrice',100000,'discount',0,'taxRate',0,'description','Zero tax')
    )
  );
  IF (v_inv->>'tax_amount')::NUMERIC<>11000 OR (v_inv->>'grand_total')::NUMERIC<>211000 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: mixed tax expected tax=11000 total=211000, got tax=% total=%',v_inv->>'tax_amount',v_inv->>'grand_total';
  END IF;

  -- -----------------------------------------------------------------------
  -- 6. ROLLBACK REGRESSION: impossible payment must not mutate invoice.
  -- -----------------------------------------------------------------------
  BEGIN
    PERFORM public.record_payment_atomic(v_invoice,999999999,CURRENT_DATE,'cash','Kas',NULL,NULL,NULL,'should fail');
    RAISE EXCEPTION 'TEST 6 FAILED: overpayment was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%melebihi sisa tagihan%' THEN
      RAISE;
    END IF;
  END;

  -- -----------------------------------------------------------------------
  -- 7. Tenant isolation sanity: fixture invoice belongs to selected org.
  -- -----------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM public.invoices WHERE id=v_invoice AND organization_id<>v_org) THEN
    RAISE EXCEPTION 'TEST 7 FAILED: invoice crossed organization boundary';
  END IF;

  RAISE NOTICE 'BILLINGFLOW E2E PASS: invoice + AR + VAT + payment + HPP + mixed tax + rollback checks passed for test transaction';
END $$;

-- Never commit test fixtures.
ROLLBACK;

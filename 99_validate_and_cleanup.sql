BEGIN;

DO $$
DECLARE
  v_org uuid;
  v_invoice uuid;
  v_invoice_no text;
  v_user uuid;
  v_count int;
  v_paid numeric;
  v_outstanding numeric;
  v_total numeric;
  v_payment_sum numeric;
  v_debit numeric;
  v_credit numeric;
BEGIN
  SELECT organization_id,invoice_id,invoice_number,user_id
  INTO v_org,v_invoice,v_invoice_no,v_user
  FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest';
  IF v_invoice IS NULL THEN RAISE EXCEPTION 'No fixture found'; END IF;

  SELECT COUNT(*) INTO v_count FROM public.invoices WHERE organization_id=v_org AND invoice_number=v_invoice_no;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'INVOICE NUMBER RACE FAILED: expected exactly 1 invoice, got %', v_count;
  END IF;

  SELECT grand_total,paid_amount,outstanding_amount INTO v_total,v_paid,v_outstanding
  FROM public.invoices WHERE id=v_invoice;
  SELECT COALESCE(SUM(amount),0) INTO v_payment_sum FROM public.payments WHERE invoice_id=v_invoice;

  IF v_outstanding < 0 THEN RAISE EXCEPTION 'PAYMENT RACE FAILED: negative outstanding %',v_outstanding; END IF;
  IF round(v_total-v_paid,2) <> round(v_outstanding,2) THEN
    RAISE EXCEPTION 'PAYMENT RACE FAILED: total=% paid=% outstanding=%',v_total,v_paid,v_outstanding;
  END IF;
  IF round(v_payment_sum,2) <> round(v_paid,2) THEN
    RAISE EXCEPTION 'PAYMENT RACE FAILED: payment rows=% invoice paid=%',v_payment_sum,v_paid;
  END IF;
  IF v_paid > v_total THEN RAISE EXCEPTION 'PAYMENT RACE FAILED: overpaid invoice'; END IF;

  SELECT COUNT(*) INTO v_count FROM public.payments WHERE invoice_id=v_invoice;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'PAYMENT RACE FAILED: expected exactly 1 successful payment, got %',v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.journal_entries je
  WHERE je.organization_id=v_org AND je.reference_type='payment'
    AND je.reference_id IN (SELECT id FROM public.payments WHERE invoice_id=v_invoice)
    AND je.status='POSTED';
  IF v_count <> 1 THEN RAISE EXCEPTION 'PAYMENT RACE FAILED: expected 1 payment journal, got %',v_count; END IF;

  SELECT COALESCE(SUM(jl.debit),0),COALESCE(SUM(jl.credit),0)
  INTO v_debit,v_credit
  FROM public.journal_lines jl
  JOIN public.journal_entries je ON je.id=jl.journal_entry_id
  WHERE je.organization_id=v_org AND je.reference_type='payment'
    AND je.reference_id IN (SELECT id FROM public.payments WHERE invoice_id=v_invoice)
    AND je.status='POSTED';
  IF round(v_debit,2) <> round(v_credit,2) THEN
    RAISE EXCEPTION 'PAYMENT RACE FAILED: payment journal unbalanced debit=% credit=%',v_debit,v_credit;
  END IF;

  RAISE NOTICE 'BILLINGFLOW CONCURRENCY PASS: one payment wins, duplicate invoice number rejected, balances and journals remain consistent';
END $$;

-- Cleanup only this test's fixture. The fixture table is also removed.
DO $$
DECLARE v_org uuid; v_invoice uuid; v_customer uuid; v_bank uuid; v_product uuid;
BEGIN
  SELECT organization_id,invoice_id,customer_id,bank_id,product_id
  INTO v_org,v_invoice,v_customer,v_bank,v_product
  FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest';

  DELETE FROM public.audit_logs WHERE organization_id=v_org AND record_id IN (
    v_invoice::text,
    (SELECT id::text FROM public.payments WHERE invoice_id=v_invoice)
  );
  DELETE FROM public.documents WHERE organization_id=v_org AND (reference_id=v_invoice OR reference_id IN (SELECT id FROM public.payments WHERE invoice_id=v_invoice));
  DELETE FROM public.journal_lines WHERE journal_entry_id IN (
    SELECT id FROM public.journal_entries WHERE organization_id=v_org AND reference_id=v_invoice
  );
  DELETE FROM public.journal_entries WHERE organization_id=v_org AND reference_id=v_invoice;
  DELETE FROM public.payments WHERE invoice_id=v_invoice;
  DELETE FROM public.invoice_items WHERE invoice_id=v_invoice;
  DELETE FROM public.invoices WHERE id=v_invoice;
  DELETE FROM public.products WHERE id=v_product;
  DELETE FROM public.bank_accounts WHERE id=v_bank;
  DELETE FROM public.customers WHERE id=v_customer;
  DELETE FROM public.billingflow_concurrency_test_fixtures WHERE test_key='latest';
END $$;

COMMIT;

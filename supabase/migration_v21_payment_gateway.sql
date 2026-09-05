-- BILLINGFLOW V21 — PAYMENT GATEWAY / MIDTRANS
-- Stores provider transactions and atomically converts a verified settlement
-- into the existing payments + invoice + document + audit flow.

CREATE TABLE IF NOT EXISTS public.payment_gateway_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  provider VARCHAR(40) NOT NULL,
  order_id VARCHAR(120) NOT NULL UNIQUE,
  transaction_id VARCHAR(120),
  gross_amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  provider_status VARCHAR(40),
  payment_type VARCHAR(50),
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pgt_org_invoice ON public.payment_gateway_transactions(organization_id, invoice_id, created_at DESC);
ALTER TABLE public.payment_gateway_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment gateway tenant read" ON public.payment_gateway_transactions;
CREATE POLICY "payment gateway tenant read" ON public.payment_gateway_transactions FOR SELECT USING (organization_id = public.get_auth_org_id());

CREATE OR REPLACE FUNCTION public.record_gateway_payment_atomic(
  p_gateway_transaction_id UUID,
  p_provider_status TEXT,
  p_payment_type TEXT,
  p_reference_number TEXT,
  p_amount NUMERIC,
  p_paid_at TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_tx RECORD; v_invoice RECORD; v_org RECORD; v_user UUID; v_user_name TEXT; v_user_role TEXT;
  v_method VARCHAR(50); v_destination TEXT; v_pay_seq INT; v_receipt_seq INT; v_payment_id UUID; v_document_id UUID;
  v_new_paid NUMERIC; v_new_outstanding NUMERIC; v_new_status TEXT; v_receipt TEXT;
BEGIN
  SELECT * INTO v_tx FROM public.payment_gateway_transactions WHERE id=p_gateway_transaction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaksi gateway tidak ditemukan'; END IF;
  IF v_tx.status='paid' THEN RETURN jsonb_build_object('ok',true,'duplicate',true,'status','paid'); END IF;

  UPDATE public.payment_gateway_transactions
  SET provider_status=p_provider_status, payment_type=p_payment_type, transaction_id=COALESCE(transaction_id,p_reference_number), updated_at=NOW()
  WHERE id=v_tx.id;

  IF NOT (p_provider_status='settlement' OR (p_provider_status='capture' AND lower(COALESCE((current_setting('request.jwt.claims',true)::jsonb->>'fraud_status'),'accept'))='accept')) THEN
    UPDATE public.payment_gateway_transactions SET status=CASE WHEN p_provider_status='expire' THEN 'expired' WHEN p_provider_status IN ('cancel','deny','failure') THEN 'failed' ELSE 'pending' END, updated_at=NOW() WHERE id=v_tx.id;
    RETURN jsonb_build_object('ok',true,'status',p_provider_status);
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id=v_tx.invoice_id AND organization_id=v_tx.organization_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice gateway tidak ditemukan'; END IF;
  IF p_amount <= 0 OR p_amount > v_invoice.outstanding_amount THEN RAISE EXCEPTION 'Nominal gateway tidak sesuai sisa invoice'; END IF;
  SELECT * INTO v_org FROM public.organizations WHERE id=v_tx.organization_id;
  v_user := v_tx.created_by;
  SELECT name, role INTO v_user_name, v_user_role FROM public.profiles WHERE id=v_user;
  v_user_name := COALESCE(v_user_name,'Payment Gateway'); v_user_role := COALESCE(v_user_role,'system');
  v_method := CASE WHEN lower(p_payment_type)='qris' THEN 'qris' WHEN lower(p_payment_type) IN ('gopay','shopeepay','dana','ovo','linkaja','akulaku') THEN 'e_wallet' WHEN lower(p_payment_type) LIKE '%va' OR lower(p_payment_type)='bank_transfer' THEN 'virtual_account' ELSE 'other' END;
  v_destination := 'Midtrans ' || COALESCE(NULLIF(p_payment_type,''),'Online');
  v_pay_seq := public.get_next_sequence('payment',0); v_receipt_seq := public.get_next_sequence('receipt',0);
  v_receipt := replace(replace(replace(COALESCE(v_org.payment_receipt_format,'KWT/{YEAR}/{MONTH}/{NUMBER}'),'{YEAR}',to_char(COALESCE(p_paid_at,NOW()),'YYYY')),'{MONTH}',to_char(COALESCE(p_paid_at,NOW()),'MM')),'{NUMBER}',lpad(v_receipt_seq::text,5,'0'));

  INSERT INTO public.payments(organization_id,payment_number,invoice_id,customer_id,payment_date,amount,payment_method,destination_bank,reference_number,notes,received_by,receipt_number,created_by)
  VALUES(v_tx.organization_id,'PAY/'||to_char(COALESCE(p_paid_at,NOW()),'YYYY')||'/'||to_char(COALESCE(p_paid_at,NOW()),'MM')||'/'||lpad(v_pay_seq::text,5,'0'),v_invoice.id,v_invoice.customer_id,COALESCE(p_paid_at,NOW())::date,p_amount,v_method,v_destination,p_reference_number,'Pembayaran otomatis via Midtrans',v_user_name||' (GATEWAY)',v_receipt,v_user) RETURNING id INTO v_payment_id;

  v_new_paid := v_invoice.paid_amount + p_amount; v_new_outstanding := GREATEST(0,v_invoice.grand_total-v_new_paid); v_new_status := CASE WHEN v_new_outstanding<=0 THEN 'paid' ELSE 'partially_paid' END;
  UPDATE public.invoices SET paid_amount=v_new_paid,outstanding_amount=v_new_outstanding,status=v_new_status,paid_at=CASE WHEN v_new_outstanding<=0 THEN COALESCE(p_paid_at,NOW()) ELSE paid_at END,updated_at=NOW() WHERE id=v_invoice.id;
  INSERT INTO public.documents(organization_id,title,document_type,document_number,customer_id,reference_id,amount,date,status)
  VALUES(v_tx.organization_id,'Kuitansi Gateway - '||v_invoice.invoice_number,'payment_receipt',v_receipt,v_invoice.customer_id,v_payment_id,p_amount,COALESCE(p_paid_at,NOW())::date,CASE WHEN v_new_status='paid' THEN 'Lunas' ELSE 'Dibayar Sebagian' END) RETURNING id INTO v_document_id;
  INSERT INTO public.audit_logs(organization_id,user_id,user_name,user_role,action,module,record_id,record_title,details)
  VALUES(v_tx.organization_id,v_user,v_user_name,v_user_role,'pay','payment_gateway',v_payment_id::text,v_invoice.invoice_number,'Pembayaran otomatis Midtrans Rp'||to_char(p_amount,'FM999,999,999,999')||' untuk '||v_invoice.invoice_number);
  UPDATE public.payment_gateway_transactions SET status='paid',paid_at=COALESCE(p_paid_at,NOW()),updated_at=NOW() WHERE id=v_tx.id;
  RETURN jsonb_build_object('ok',true,'status','paid','payment_id',v_payment_id,'invoice_id',v_invoice.id,'outstanding_amount',v_new_outstanding);
END; $$;
REVOKE ALL ON FUNCTION public.record_gateway_payment_atomic(UUID,TEXT,TEXT,TEXT,NUMERIC,TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_gateway_payment_atomic(UUID,TEXT,TEXT,TEXT,NUMERIC,TIMESTAMPTZ) TO service_role;

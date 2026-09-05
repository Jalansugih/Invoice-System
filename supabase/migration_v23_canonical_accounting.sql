-- BILLINGFLOW V23 — CANONICAL ACCOUNTING REPORTS + EXPLICIT DOCUMENT JOURNAL POSTING
-- Run after migration_v14_unified_accounting.sql and migration_v5_atomic_payment.sql.
-- Safe to re-run.

-- The payment trigger already invokes post_payment_journal() in V14.
-- Calling it explicitly inside the atomic RPC makes the invariant obvious
-- and keeps payment + journal in the same Postgres transaction. The function
-- is idempotent, so the trigger and explicit call cannot create duplicates.
CREATE OR REPLACE FUNCTION public.record_payment_atomic(
    p_invoice_id UUID,
    p_amount NUMERIC,
    p_payment_date DATE,
    p_payment_method VARCHAR,
    p_destination_bank VARCHAR DEFAULT NULL,
    p_bank_account_id UUID DEFAULT NULL,
    p_account_number VARCHAR DEFAULT NULL,
    p_reference_number VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID := public.get_auth_org_id();
    v_user_id UUID := auth.uid();
    v_user_name VARCHAR;
    v_user_role VARCHAR;
    v_invoice RECORD;
    v_org RECORD;
    v_pay_seq INT;
    v_receipt_seq INT;
    v_payment_number VARCHAR;
    v_receipt_number VARCHAR;
    v_new_paid_amount NUMERIC;
    v_new_outstanding NUMERIC;
    v_new_status VARCHAR;
    v_new_paid_at TIMESTAMPTZ;
    v_destination_bank VARCHAR;
    v_payment_id UUID;
    v_document_id UUID;
BEGIN
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Tidak ditemukan organisasi untuk user yang sedang login'; END IF;

    SELECT name, role INTO v_user_name, v_user_role
    FROM public.profiles WHERE id = v_user_id;
    v_user_name := COALESCE(v_user_name, 'Pengguna');
    v_user_role := COALESCE(v_user_role, 'staff');

    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id AND organization_id = v_org_id
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Invoice tidak ditemukan'; END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Nominal pembayaran harus lebih dari 0'; END IF;
    IF p_amount > v_invoice.outstanding_amount THEN
        RAISE EXCEPTION 'Nominal pembayaran melebihi sisa tagihan (%)', v_invoice.outstanding_amount;
    END IF;

    SELECT * INTO v_org FROM public.organizations WHERE id = v_org_id;

    v_pay_seq := public.get_next_sequence('payment', 0);
    v_receipt_seq := public.get_next_sequence('receipt', 0);

    v_payment_number := 'PAY/' || to_char(p_payment_date, 'YYYY') || '/' ||
        to_char(p_payment_date, 'MM') || '/' || lpad(v_pay_seq::text, 5, '0');

    v_receipt_number := COALESCE(v_org.payment_receipt_format, 'KWT/{YEAR}/{MONTH}/{NUMBER}');
    v_receipt_number := replace(v_receipt_number, '{YEAR}', to_char(p_payment_date, 'YYYY'));
    v_receipt_number := replace(v_receipt_number, '{MONTH}', to_char(p_payment_date, 'MM'));
    v_receipt_number := replace(v_receipt_number, '{NUMBER}', lpad(v_receipt_seq::text, 5, '0'));

    v_destination_bank := COALESCE(
        p_destination_bank,
        (SELECT bank_name FROM public.bank_accounts
         WHERE id = p_bank_account_id AND organization_id = v_org_id),
        'Bank Transfer'
    );

    INSERT INTO public.payments (
        organization_id, payment_number, invoice_id, customer_id, payment_date,
        amount, payment_method, destination_bank, bank_account_id, account_number,
        reference_number, notes, received_by, receipt_number, created_by
    ) VALUES (
        v_org_id, v_payment_number, v_invoice.id, v_invoice.customer_id, p_payment_date,
        p_amount, p_payment_method, v_destination_bank, p_bank_account_id, p_account_number,
        p_reference_number, p_notes, v_user_name || ' (' || upper(v_user_role) || ')',
        v_receipt_number, v_user_id
    ) RETURNING id INTO v_payment_id;

    v_new_paid_amount := v_invoice.paid_amount + p_amount;
    v_new_outstanding := GREATEST(0, v_invoice.grand_total - v_new_paid_amount);
    v_new_status := CASE WHEN v_new_outstanding <= 0 THEN 'paid' ELSE 'partially_paid' END;
    v_new_paid_at := CASE WHEN v_new_outstanding <= 0 THEN NOW() ELSE v_invoice.paid_at END;

    UPDATE public.invoices SET
        paid_amount = v_new_paid_amount,
        outstanding_amount = v_new_outstanding,
        status = v_new_status,
        paid_at = v_new_paid_at,
        updated_at = NOW()
    WHERE id = v_invoice.id;

    INSERT INTO public.documents (
        organization_id, title, document_type, document_number, customer_id,
        reference_id, amount, date, status
    ) VALUES (
        v_org_id, 'Kuitansi Penerimaan Pembayaran - ' || v_invoice.customer_id::text,
        'payment_receipt', v_receipt_number, v_invoice.customer_id, v_payment_id,
        p_amount, p_payment_date,
        CASE WHEN v_new_status = 'paid' THEN 'Lunas' ELSE 'Dibayar Sebagian' END
    ) RETURNING id INTO v_document_id;

    INSERT INTO public.audit_logs (
        organization_id, user_id, user_name, user_role, action, module,
        record_id, record_title, details
    ) VALUES (
        v_org_id, v_user_id, v_user_name, v_user_role, 'pay', 'payments',
        v_payment_id::text, v_payment_number,
        'Mencatat pembayaran Rp' || to_char(p_amount, 'FM999,999,999,999') ||
        ' untuk ' || v_invoice.invoice_number
    );

    -- Canonical accounting side effect: payment and its journal are committed
    -- together. post_payment_journal() is idempotent and also used by the
    -- AFTER INSERT trigger from V14.
    PERFORM public.post_payment_journal(v_payment_id);

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'payment_number', v_payment_number,
        'receipt_number', v_receipt_number,
        'document_id', v_document_id,
        'invoice_id', v_invoice.id,
        'invoice_number', v_invoice.invoice_number,
        'customer_id', v_invoice.customer_id,
        'paid_amount', v_new_paid_amount,
        'outstanding_amount', v_new_outstanding,
        'status', v_new_status,
        'paid_at', v_new_paid_at,
        'destination_bank', v_destination_bank,
        'received_by', v_user_name || ' (' || upper(v_user_role) || ')'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_atomic(
    UUID, NUMERIC, DATE, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT
) TO authenticated;

-- Invoice posting is already server-side through post_invoice_journal() and
-- the invoice accounting trigger from V14. The following canonical views are
-- the read layer: reports must read these views, never reconstruct journals
-- from invoices/payments in the browser.

CREATE OR REPLACE VIEW public.general_journal AS
SELECT
    je.organization_id,
    je.id AS journal_entry_id,
    je.journal_number,
    je.journal_date,
    je.reference_type,
    je.reference_id,
    je.description AS journal_description,
    je.status,
    jl.id AS journal_line_id,
    jl.account_id,
    a.code AS account_code,
    a.name AS account_name,
    a.account_type,
    jl.description AS line_description,
    jl.debit,
    jl.credit
FROM public.journal_entries je
JOIN public.journal_lines jl ON jl.journal_entry_id = je.id
JOIN public.accounts a ON a.id = jl.account_id
WHERE je.status = 'POSTED'
  AND je.organization_id = public.get_auth_org_id();

CREATE OR REPLACE VIEW public.general_ledger AS
SELECT
    organization_id,
    account_id,
    account_code,
    account_name,
    account_type,
    journal_date,
    journal_number,
    reference_type,
    reference_id,
    line_description,
    debit,
    credit,
    SUM(debit - credit) OVER (
      PARTITION BY organization_id, account_id
      ORDER BY journal_date, journal_number, journal_line_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance,
    journal_entry_id,
    journal_line_id
FROM public.general_journal;

CREATE OR REPLACE VIEW public.trial_balance AS
SELECT
    organization_id,
    account_id,
    account_code,
    account_name,
    account_type,
    COALESCE(SUM(debit),0) AS debit,
    COALESCE(SUM(credit),0) AS credit,
    COALESCE(SUM(debit - credit),0) AS net_balance
FROM public.general_journal
GROUP BY organization_id, account_id, account_code, account_name, account_type;

COMMENT ON VIEW public.general_journal IS 'Canonical Jurnal Umum: hanya POSTED journal_entries/journal_lines untuk tenant aktif.';
COMMENT ON VIEW public.general_ledger IS 'Canonical Buku Besar: running balance dihitung dari Jurnal Umum.';
COMMENT ON VIEW public.trial_balance IS 'Canonical Neraca Saldo: agregasi debit/kredit dari Jurnal Umum.';

GRANT SELECT ON public.general_journal, public.general_ledger, public.trial_balance TO authenticated;

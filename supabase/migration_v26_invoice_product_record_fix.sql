-- BILLINGFLOW V26 — FIX: invoice RPC custom-line product record initialization
--
-- Root cause of: "record \"v_product\" is not assigned yet"
-- In V24 the product variable was declared as an untyped RECORD. For a custom
-- invoice line (productId is NULL), no SELECT INTO ran, but later expressions
-- still accessed v_product.price/code/name/unit. PostgreSQL raises the runtime
-- error because the RECORD has never been assigned a row shape.
--
-- Fix: use the concrete products row type. This keeps custom lines valid while
-- product-backed lines still validate organization + active product.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.create_invoice_atomic(
  p_invoice_id UUID,
  p_invoice_number VARCHAR,
  p_customer_id UUID,
  p_issue_date DATE,
  p_due_date DATE,
  p_po_number VARCHAR DEFAULT NULL,
  p_reference_number VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_payment_terms VARCHAR DEFAULT NULL,
  p_discount_type VARCHAR DEFAULT 'fixed',
  p_discount_value NUMERIC DEFAULT 0,
  p_tax_rate NUMERIC DEFAULT 11,
  p_additional_charges NUMERIC DEFAULT 0,
  p_bank_account_id UUID DEFAULT NULL,
  p_status VARCHAR DEFAULT 'draft',
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := public.get_auth_org_id();
  v_user_id UUID := auth.uid();
  v_customer RECORD;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_item_id UUID;
  v_product_id UUID;
  v_qty NUMERIC;
  v_unit_price NUMERIC;
  v_discount NUMERIC;
  v_tax_rate NUMERIC;
  v_amount NUMERIC;
  v_subtotal NUMERIC := 0;
  v_discount_amount NUMERIC := 0;
  v_taxable NUMERIC := 0;
  v_tax_amount NUMERIC := 0;
  v_additional NUMERIC := GREATEST(COALESCE(p_additional_charges,0),0);
  v_grand_total NUMERIC := 0;
  v_item_count INT := 0;
  v_status VARCHAR;
  v_invoice RECORD;
  BEGIN
  IF v_org_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'User belum terautentikasi atau organisasi tidak ditemukan';
  END IF;

  IF p_invoice_id IS NULL THEN RAISE EXCEPTION 'Invoice ID wajib diisi'; END IF;
  IF NULLIF(trim(p_invoice_number),'') IS NULL THEN RAISE EXCEPTION 'Nomor invoice wajib diisi'; END IF;
  IF p_issue_date IS NULL OR p_due_date IS NULL THEN RAISE EXCEPTION 'Tanggal invoice dan jatuh tempo wajib diisi'; END IF;
  IF p_due_date < p_issue_date THEN RAISE EXCEPTION 'Jatuh tempo tidak boleh sebelum tanggal invoice'; END IF;
  IF p_discount_type NOT IN ('fixed','percentage') THEN RAISE EXCEPTION 'Jenis diskon invoice tidak valid'; END IF;
  IF p_status NOT IN ('draft','sent','viewed','unpaid','partially_paid','paid','overdue','cancelled') THEN
    RAISE EXCEPTION 'Status invoice tidak valid';
  END IF;
  IF COALESCE(jsonb_typeof(p_items),'null') <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Invoice harus memiliki setidaknya satu item';
  END IF;
  IF COALESCE(p_discount_value,0) < 0 OR COALESCE(p_tax_rate,0) < 0 THEN
    RAISE EXCEPTION 'Diskon dan pajak tidak boleh negatif';
  END IF;

  SELECT * INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id AND organization_id = v_org_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer tidak ditemukan pada organisasi aktif'; END IF;

  IF p_bank_account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.bank_accounts
    WHERE id=p_bank_account_id AND organization_id=v_org_id
  ) THEN
    RAISE EXCEPTION 'Rekening bank tidak ditemukan pada organisasi aktif';
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE id=p_invoice_id) THEN
    RAISE EXCEPTION 'Invoice dengan ID tersebut sudah ada';
  END IF;

  -- Serialize duplicate invoice numbers per organization. This is a lock,
  -- not merely a client-side counter check.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_org_id::text || ':' || p_invoice_number, 0));
  IF EXISTS (
    SELECT 1 FROM public.invoices
    WHERE organization_id=v_org_id AND invoice_number=p_invoice_number
  ) THEN
    RAISE EXCEPTION 'Nomor invoice % sudah digunakan', p_invoice_number;
  END IF;

  -- Recompute line amounts inside Postgres. A product_id always uses the
  -- current organization product master price/tax/unit; custom lines use
  -- the supplied unit price.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_item_count := v_item_count + 1;
    v_product_id := NULLIF(v_item->>'productId','')::UUID;
    v_product := NULL;

    IF v_product_id IS NOT NULL THEN
      SELECT id, code, name, price, tax_rate, unit
      INTO v_product
      FROM public.products
      WHERE id=v_product_id AND organization_id=v_org_id AND is_active=TRUE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Produk % tidak ditemukan/aktif pada organisasi', v_product_id; END IF;
    END IF;

    v_qty := GREATEST(COALESCE((v_item->>'quantity')::NUMERIC,1),0.01);
    v_unit_price := GREATEST(COALESCE(v_product.price, (v_item->>'unitPrice')::NUMERIC,0),0);
    v_discount := GREATEST(COALESCE((v_item->>'discount')::NUMERIC,0),0);
    v_discount := LEAST(v_discount, v_qty*v_unit_price);
    v_tax_rate := GREATEST(COALESCE((v_item->>'taxRate')::NUMERIC, v_product.tax_rate, 11),0);
    v_amount := GREATEST(round((v_qty*v_unit_price)-v_discount),0);
    v_subtotal := v_subtotal + v_amount;
  END LOOP;

  IF p_discount_type='percentage' THEN
    v_discount_amount := round(v_subtotal * LEAST(COALESCE(p_discount_value,0),100) / 100);
  ELSE
    v_discount_amount := LEAST(v_subtotal, GREATEST(COALESCE(p_discount_value,0),0));
  END IF;

  v_taxable := GREATEST(v_subtotal-v_discount_amount,0);

  -- Calculate tax from each line's effective tax rate. The invoice discount is
  -- prorated by line amount so mixed-tax invoices remain mathematically stable.
  v_tax_amount := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'productId','')::UUID;
    v_product := NULL;
    IF v_product_id IS NOT NULL THEN
      SELECT id, price, tax_rate, unit INTO v_product
      FROM public.products
      WHERE id=v_product_id AND organization_id=v_org_id AND is_active=TRUE;
    END IF;
    v_qty := GREATEST(COALESCE((v_item->>'quantity')::NUMERIC,1),0.01);
    v_unit_price := GREATEST(COALESCE(v_product.price, (v_item->>'unitPrice')::NUMERIC,0),0);
    v_discount := LEAST(GREATEST(COALESCE((v_item->>'discount')::NUMERIC,0),0), v_qty*v_unit_price);
    v_amount := GREATEST(round((v_qty*v_unit_price)-v_discount),0);
    v_tax_rate := GREATEST(COALESCE((v_item->>'taxRate')::NUMERIC, v_product.tax_rate, p_tax_rate, 0),0);
    v_tax_amount := v_tax_amount + CASE
      WHEN v_subtotal > 0 AND v_tax_rate > 0 THEN
        round(GREATEST(v_amount - (v_discount_amount * v_amount / v_subtotal),0) * v_tax_rate / 100)
      ELSE 0 END;
  END LOOP;
  v_tax_amount := round(v_tax_amount,0);
  v_grand_total := v_taxable + v_tax_amount + v_additional;
  p_tax_rate := CASE WHEN v_taxable > 0 THEN round(v_tax_amount / v_taxable * 100, 2) ELSE 0 END;
  v_status := COALESCE(p_status,'draft');

  INSERT INTO public.invoices(
    id, organization_id, invoice_number, customer_id,
    issue_date, due_date, po_number, reference_number, notes, payment_terms,
    subtotal, discount_type, discount_value, discount_amount,
    tax_rate, tax_amount, additional_charges, grand_total,
    paid_amount, outstanding_amount, status, bank_account_id,
    created_by, created_at, updated_at
  ) VALUES (
    p_invoice_id, v_org_id, p_invoice_number, p_customer_id,
    p_issue_date, p_due_date, p_po_number, p_reference_number, p_notes, p_payment_terms,
    v_subtotal, p_discount_type, GREATEST(COALESCE(p_discount_value,0),0), v_discount_amount,
    GREATEST(COALESCE(p_tax_rate,0),0), v_tax_amount, v_additional, v_grand_total,
    0, v_grand_total, v_status, p_bank_account_id,
    v_user_id, NOW(), NOW()
  ) RETURNING * INTO v_invoice;

  -- Insert items only after header exists. Both inserts remain in this RPC's
  -- transaction; the AFTER INSERT accounting trigger also runs in it.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := NULLIF(v_item->>'productId','')::UUID;
    v_product := NULL;
    IF v_product_id IS NOT NULL THEN
      SELECT id, code, name, price, tax_rate, unit
      INTO v_product FROM public.products
      WHERE id=v_product_id AND organization_id=v_org_id AND is_active=TRUE;
    END IF;

    v_qty := GREATEST(COALESCE((v_item->>'quantity')::NUMERIC,1),0.01);
    v_unit_price := GREATEST(COALESCE(v_product.price, (v_item->>'unitPrice')::NUMERIC,0),0);
    v_discount := LEAST(GREATEST(COALESCE((v_item->>'discount')::NUMERIC,0),0), v_qty*v_unit_price);
    v_tax_rate := GREATEST(COALESCE((v_item->>'taxRate')::NUMERIC, v_product.tax_rate, 11),0);
    v_amount := GREATEST(round((v_qty*v_unit_price)-v_discount),0);

    INSERT INTO public.invoice_items(
      id, invoice_id, product_id, product_code, description,
      quantity, unit, unit_price, discount, tax_rate, amount
    ) VALUES (
      COALESCE(NULLIF(v_item->>'id','')::UUID, gen_random_uuid()),
      p_invoice_id,
      v_product_id,
      COALESCE(NULLIF(v_item->>'productCode',''), v_product.code, 'CUSTOM'),
      COALESCE(NULLIF(v_item->>'description',''), v_product.name, 'Item Tagihan'),
      v_qty,
      COALESCE(NULLIF(v_item->>'unit',''), v_product.unit, 'Unit'),
      v_unit_price,
      v_discount,
      v_tax_rate,
      v_amount
    );
  END LOOP;

  -- Inventory posting must happen after all invoice_items exist. The header
  -- INSERT trigger intentionally cannot see the line items yet, so invoke the
  -- inventory posting explicitly here while remaining in this same transaction.
  PERFORM public.post_invoice_inventory(p_invoice_id);

  -- Recalculate aggregates rather than incrementing stale values. This is
  -- still inside the same transaction and prevents drift on existing data.
  UPDATE public.customers
  SET total_invoiced = COALESCE((SELECT SUM(grand_total) FROM public.invoices WHERE organization_id=v_org_id AND customer_id=p_customer_id AND status <> 'cancelled'),0),
      total_outstanding = COALESCE((SELECT SUM(outstanding_amount) FROM public.invoices WHERE organization_id=v_org_id AND customer_id=p_customer_id AND status <> 'cancelled'),0),
      updated_at = NOW()
  WHERE id=p_customer_id AND organization_id=v_org_id;

  INSERT INTO public.audit_logs(
    organization_id,user_id,user_name,user_role,action,module,record_id,record_title,details
  )
  SELECT v_org_id,v_user_id,COALESCE(pr.name,'Pengguna'),COALESCE(pr.role,'staff'),
         'create','invoices',p_invoice_id::text,p_invoice_number,
         'Invoice dibuat atomic: '||v_item_count||' item, total Rp '||to_char(v_grand_total,'FM999G999G999G999D00')
  FROM public.profiles pr WHERE pr.id=v_user_id;

  RETURN jsonb_build_object(
    'id',v_invoice.id,
    'organization_id',v_invoice.organization_id,
    'invoice_number',v_invoice.invoice_number,
    'customer_id',v_invoice.customer_id,
    'issue_date',v_invoice.issue_date,
    'due_date',v_invoice.due_date,
    'subtotal',v_invoice.subtotal,
    'discount_type',v_invoice.discount_type,
    'discount_value',v_invoice.discount_value,
    'discount_amount',v_invoice.discount_amount,
    'tax_rate',v_invoice.tax_rate,
    'tax_amount',v_invoice.tax_amount,
    'additional_charges',v_invoice.additional_charges,
    'grand_total',v_invoice.grand_total,
    'paid_amount',v_invoice.paid_amount,
    'outstanding_amount',v_invoice.outstanding_amount,
    'status',v_invoice.status,
    'bank_account_id',v_invoice.bank_account_id,
    'created_at',v_invoice.created_at,
    'updated_at',v_invoice.updated_at,
    'journal_created', EXISTS (
      SELECT 1 FROM public.journal_entries
      WHERE reference_type='invoice' AND reference_id=p_invoice_id AND status='POSTED'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice_atomic(UUID,VARCHAR,UUID,DATE,DATE,VARCHAR,VARCHAR,TEXT,VARCHAR,VARCHAR,NUMERIC,NUMERIC,NUMERIC,UUID,VARCHAR,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invoice_atomic(UUID,VARCHAR,UUID,DATE,DATE,VARCHAR,VARCHAR,TEXT,VARCHAR,VARCHAR,NUMERIC,NUMERIC,NUMERIC,UUID,VARCHAR,JSONB) TO authenticated;

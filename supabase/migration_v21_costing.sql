-- BillingFlow Costing & Profit v1
-- Additive migration. Does not modify or delete existing invoice/customer/tenant data.

-- Required before the composite invoice_id + organization_id FK below.
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoices_id_organization_id
  ON public.invoices(id, organization_id);

CREATE TABLE IF NOT EXISTS public.invoice_costings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL,
  nilai_tender NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (nilai_tender >= 0),
  hpp_barang NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (hpp_barang >= 0),
  biaya_langsung NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (biaya_langsung >= 0),
  total_biaya NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_biaya >= 0),
  estimasi_laba NUMERIC(18,2) NOT NULL DEFAULT 0,
  margin_persen NUMERIC(9,4),
  markup_persen NUMERIC(9,4),
  harga_bep NUMERIC(18,2),
  harga_target NUMERIC(18,2),
  hpp_maksimal NUMERIC(18,2),
  target_margin NUMERIC(9,4) NOT NULL DEFAULT 10 CHECK (target_margin >= 0 AND target_margin < 100),
  status VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (status IN ('safe','warning','danger')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoice_costings_invoice_unique UNIQUE (invoice_id),
  CONSTRAINT invoice_costings_id_org_unique UNIQUE (id, organization_id),
  CONSTRAINT invoice_costings_invoice_org_fk FOREIGN KEY (invoice_id, organization_id)
    REFERENCES public.invoices(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.invoice_costing_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_id UUID NOT NULL REFERENCES public.invoice_costings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  input_type VARCHAR(10) NOT NULL CHECK (input_type IN ('rp','percent')),
  input_value NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (input_value >= 0),
  basis VARCHAR(20),
  calculated_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (calculated_amount >= 0),
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoice_costing_components_costing_org_fk FOREIGN KEY (costing_id, organization_id)
    REFERENCES public.invoice_costings(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT invoice_costing_components_basis_ck CHECK (
    (input_type = 'rp' AND basis IS NULL) OR
    (input_type = 'percent' AND basis IN ('tender','hpp','direct_cost'))
  )
);

CREATE INDEX IF NOT EXISTS idx_invoice_costings_org ON public.invoice_costings(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_costings_invoice ON public.invoice_costings(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_costing_components_costing ON public.invoice_costing_components(costing_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_invoice_costing_components_org ON public.invoice_costing_components(organization_id);

ALTER TABLE public.invoice_costings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_costing_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Costings tenant read" ON public.invoice_costings;
CREATE POLICY "Costings tenant read" ON public.invoice_costings
  FOR SELECT TO authenticated
  USING (organization_id = public.get_auth_org_id());

DROP POLICY IF EXISTS "Costings tenant insert" ON public.invoice_costings;
CREATE POLICY "Costings tenant insert" ON public.invoice_costings
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_costings.invoice_id
        AND i.organization_id = public.get_auth_org_id()
        AND i.customer_id = invoice_costings.customer_id
    )
  );

DROP POLICY IF EXISTS "Costings tenant update" ON public.invoice_costings;
CREATE POLICY "Costings tenant update" ON public.invoice_costings
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_auth_org_id())
  WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_costings.invoice_id
        AND i.organization_id = public.get_auth_org_id()
        AND i.customer_id = invoice_costings.customer_id
    )
  );

DROP POLICY IF EXISTS "Costings tenant delete" ON public.invoice_costings;
CREATE POLICY "Costings tenant delete" ON public.invoice_costings
  FOR DELETE TO authenticated
  USING (organization_id = public.get_auth_org_id());

DROP POLICY IF EXISTS "Costing components tenant read" ON public.invoice_costing_components;
CREATE POLICY "Costing components tenant read" ON public.invoice_costing_components
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_auth_org_id()
    AND EXISTS (SELECT 1 FROM public.invoice_costings c WHERE c.id = costing_id AND c.organization_id = public.get_auth_org_id())
  );

DROP POLICY IF EXISTS "Costing components tenant insert" ON public.invoice_costing_components;
CREATE POLICY "Costing components tenant insert" ON public.invoice_costing_components
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND EXISTS (SELECT 1 FROM public.invoice_costings c WHERE c.id = costing_id AND c.organization_id = public.get_auth_org_id())
  );

DROP POLICY IF EXISTS "Costing components tenant update" ON public.invoice_costing_components;
CREATE POLICY "Costing components tenant update" ON public.invoice_costing_components
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_auth_org_id())
  WITH CHECK (
    organization_id = public.get_auth_org_id()
    AND EXISTS (SELECT 1 FROM public.invoice_costings c WHERE c.id = costing_id AND c.organization_id = public.get_auth_org_id())
  );

DROP POLICY IF EXISTS "Costing components tenant delete" ON public.invoice_costing_components;
CREATE POLICY "Costing components tenant delete" ON public.invoice_costing_components
  FOR DELETE TO authenticated
  USING (organization_id = public.get_auth_org_id());

-- Keep updated_at correct for direct SQL edits as well as application saves.
CREATE OR REPLACE FUNCTION public.set_invoice_costing_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_costings_updated_at ON public.invoice_costings;
CREATE TRIGGER trg_invoice_costings_updated_at
BEFORE UPDATE ON public.invoice_costings
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_costing_updated_at();

DROP TRIGGER IF EXISTS trg_invoice_costing_components_updated_at ON public.invoice_costing_components;
CREATE TRIGGER trg_invoice_costing_components_updated_at
BEFORE UPDATE ON public.invoice_costing_components
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_costing_updated_at();

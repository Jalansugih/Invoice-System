-- =========================================================================
-- BILLINGFLOW V21 — COSTING & PROFIT ("Anti-Boncos Engine")
-- Jalankan SETELAH migration.sql / v9 pada Supabase SQL Editor.
--
-- Tujuan:
-- 1. Menyimpan analisis costing/profitabilitas yang MELEKAT pada satu invoice.
-- 2. Satu costing aktif per invoice (unique invoice_id).
-- 3. Isolasi antar tenant via RLS memakai public.get_auth_org_id() (sama
--    persis dengan tabel lain). Komponen biaya mengikuti org lewat parent-nya.
--
-- Perhitungan (BEP, harga target, HPP maksimal, margin, status) TIDAK
-- disimpan di database - selalu diturunkan di aplikasi oleh lib/costingCalc.ts
-- agar ada satu sumber rumus. Yang disimpan hanya INPUT mentah.
-- =========================================================================

-- 1. Costing header (satu baris per invoice)
CREATE TABLE IF NOT EXISTS public.costings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    transaction_date DATE,
    tender_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    hpp_barang NUMERIC(18,2) NOT NULL DEFAULT 0,
    target_margin NUMERIC(6,2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT costings_invoice_unique UNIQUE (invoice_id)
);

-- 2. Komponen biaya (child dari costings)
CREATE TABLE IF NOT EXISTS public.costing_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    costing_id UUID NOT NULL REFERENCES public.costings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    input_type VARCHAR(10) NOT NULL DEFAULT 'rp' CHECK (input_type IN ('rp', 'percent')),
    value NUMERIC(18,4) NOT NULL DEFAULT 0,
    basis VARCHAR(20) CHECK (basis IN ('nilai_tender', 'hpp', 'biaya_langsung')),
    is_direct_cost BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_costings_org ON public.costings(organization_id);
CREATE INDEX IF NOT EXISTS idx_costings_invoice ON public.costings(invoice_id);
CREATE INDEX IF NOT EXISTS idx_costing_components_costing ON public.costing_components(costing_id);

-- 4. updated_at trigger (fungsi set_updated_at sudah ada dari migration.sql).
--    Dibuat idempoten: buat fungsi bila belum ada, lalu pasang trigger.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_costings_updated_at ON public.costings;
CREATE TRIGGER trg_costings_updated_at
BEFORE UPDATE ON public.costings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Row Level Security
ALTER TABLE public.costings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costing_components ENABLE ROW LEVEL SECURITY;

-- Costings: isolasi per tenant (pola identik dengan invoices).
DROP POLICY IF EXISTS "Costings isolation policy" ON public.costings;
CREATE POLICY "Costings isolation policy" ON public.costings
FOR ALL
USING (organization_id = public.get_auth_org_id())
WITH CHECK (organization_id = public.get_auth_org_id());

-- Costing components: ikut org lewat parent costing (pola identik invoice_items).
DROP POLICY IF EXISTS "Costing components isolation policy" ON public.costing_components;
CREATE POLICY "Costing components isolation policy" ON public.costing_components
FOR ALL
USING (costing_id IN (SELECT id FROM public.costings WHERE organization_id = public.get_auth_org_id()))
WITH CHECK (costing_id IN (SELECT id FROM public.costings WHERE organization_id = public.get_auth_org_id()));

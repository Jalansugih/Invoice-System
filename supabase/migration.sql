-- =========================================================================
-- BILLINGFLOW SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Multi-tenant Financial Invoicing, Billing Letters, Payments & Audit Trail
-- Compatible with direct copy-paste execution in Supabase SQL Editor
-- =========================================================================

-- 1. Enable Required Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table (Multi-tenant Root)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_type VARCHAR(30) NOT NULL DEFAULT 'pt' CHECK (organization_type IN ('pt','cv','firma','koperasi','yayasan','ud','perorangan','instansi','other')),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    npwp VARCHAR(50),
    website VARCHAR(255),
    signature_name VARCHAR(255),
    signature_role VARCHAR(255),
    signature_image TEXT,
    default_tax_rate NUMERIC(5,2) DEFAULT 11.00,
    default_currency VARCHAR(10) DEFAULT 'IDR',
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    invoice_format VARCHAR(100) DEFAULT 'INV/{YEAR}/{MONTH}/{NUMBER}',
    billing_letter_format VARCHAR(100) DEFAULT 'ST/{YEAR}/{MONTH}/{NUMBER}',
    payment_receipt_format VARCHAR(100) DEFAULT 'KWT/{YEAR}/{MONTH}/{NUMBER}',
    default_payment_terms_days INT DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    branch VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Profiles & Organization Memberships (Foreign Key to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'finance' CHECK (role IN ('owner', 'admin', 'finance', 'staff', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customers / Clients Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    npwp VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    pic VARCHAR(255) NOT NULL,
    pic_phone VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    total_invoiced NUMERIC(15,2) DEFAULT 0,
    total_paid NUMERIC(15,2) DEFAULT 0,
    total_outstanding NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Products / Services Master
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 11.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    po_number VARCHAR(100),
    reference_number VARCHAR(100),
    notes TEXT,
    payment_terms VARCHAR(255),
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'fixed' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 11.00,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    additional_charges NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    outstanding_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code VARCHAR(50),
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 11.00,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'qris', 'virtual_account', 'giro_cek', 'e_wallet', 'other')),
    destination_bank VARCHAR(255) NOT NULL,
    account_number VARCHAR(100),
    reference_number VARCHAR(100),
    notes TEXT,
    received_by VARCHAR(255),
    receipt_number VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Surat Tagihan (Billing Letters / Dunning Notices)
CREATE TABLE IF NOT EXISTS public.billing_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    letter_number VARCHAR(100) NOT NULL,
    letter_type VARCHAR(50) NOT NULL CHECK (letter_type IN ('sp1', 'sp2', 'sp3', 'somasi', 'pemberitahuan', 'first_reminder', 'second_warning', 'final_demand')),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    letter_date DATE NOT NULL,
    invoice_due_date DATE NOT NULL,
    overdue_days INT NOT NULL DEFAULT 0,
    total_invoice_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    outstanding_amount NUMERIC(15,2) NOT NULL,
    extended_due_date DATE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Document Archive / Center
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'billing_letter', 'payment_receipt', 'purchase_order', 'quotation', 'sales_order', 'delivery_order', 'bast', 'credit_note', 'debit_note', 'other')),
    document_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    reference_id UUID,
    amount NUMERIC(15,2),
    date DATE NOT NULL,
    status VARCHAR(50),
    file_url TEXT,
    parent_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    record_title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Automatic User Profile & Organization Trigger on Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id UUID;
    org_name TEXT;
    user_role TEXT;
    user_fullname TEXT;
BEGIN
    -- Extract metadata from raw_user_meta_data
    org_name := COALESCE(new.raw_user_meta_data->>'organization_name', 'Perusahaan Baru');
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'owner');
    user_fullname := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    
    -- Check if organization_id is already passed, otherwise generate a new one
    IF new.raw_user_meta_data->>'organization_id' IS NOT NULL AND new.raw_user_meta_data->>'organization_id' ~ '^[0-9a-fA-F-]{36}$' THEN
        org_id := (new.raw_user_meta_data->>'organization_id')::UUID;
    ELSE
        org_id := gen_random_uuid();
    END IF;

    -- Ensure organization exists
    INSERT INTO public.organizations (id, name, email, created_at, updated_at)
    VALUES (org_id, org_name, new.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, organization_id, name, email, role, created_at, updated_at)
    VALUES (new.id, org_id, user_fullname, new.email, user_role, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        organization_id = COALESCE(public.profiles.organization_id, EXCLUDED.organization_id),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_letters_org ON public.billing_letters(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON public.documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_date ON public.documents(organization_id, document_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);

-- 15. Enable Row Level Security (RLS) on ALL tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 16. Multi-Tenant RLS Policies (Organization Level Isolation)

-- Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users can see and update their own profile and profiles within the same organization
DROP POLICY IF EXISTS "Profiles isolation policy" ON public.profiles;
CREATE POLICY "Profiles isolation policy" ON public.profiles
    FOR ALL
    USING (id = auth.uid() OR organization_id = public.get_auth_org_id())
    WITH CHECK (id = auth.uid() OR organization_id = public.get_auth_org_id());

-- Organizations: Users can view and update their own organization.
-- NOTE: a single "FOR ALL" policy checking id = get_auth_org_id() would also
-- gate INSERT. For a brand-new user, public.profiles has no row yet, so
-- get_auth_org_id() returns NULL and the very first organization INSERT
-- (done during sign-up bootstrap) would always be rejected by RLS - a
-- chicken-and-egg bug that silently breaks all first-time sign-ups. We
-- split this into scoped policies and open INSERT to any authenticated
-- user instead (previously fixed ad-hoc in migration_v6_fix_org_bootstrap.sql;
-- merged here so a fresh database created from this consolidated file does
-- not need that patch applied separately).
DROP POLICY IF EXISTS "Organizations isolation policy" ON public.organizations;
DROP POLICY IF EXISTS "Organizations multi-tenant policy" ON public.organizations;
DROP POLICY IF EXISTS "Organizations: view own org" ON public.organizations;
DROP POLICY IF EXISTS "Organizations: update own org" ON public.organizations;
DROP POLICY IF EXISTS "Organizations: delete own org" ON public.organizations;
DROP POLICY IF EXISTS "Organizations: authenticated can bootstrap" ON public.organizations;

CREATE POLICY "Organizations: view own org" ON public.organizations
    FOR SELECT
    USING (id = public.get_auth_org_id());

CREATE POLICY "Organizations: update own org" ON public.organizations
    FOR UPDATE
    USING (id = public.get_auth_org_id())
    WITH CHECK (id = public.get_auth_org_id());

CREATE POLICY "Organizations: delete own org" ON public.organizations
    FOR DELETE
    USING (id = public.get_auth_org_id());

-- Bootstrap: any authenticated user may create an organization row (needed
-- because their profile - and therefore get_auth_org_id() - does not exist
-- yet at sign-up time). The app immediately links a profiles row to it in
-- the same flow, so this does not let a user attach to or take over an
-- existing organization; it only allows creating a brand-new one.
CREATE POLICY "Organizations: authenticated can bootstrap" ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Bank Accounts
DROP POLICY IF EXISTS "Bank accounts isolation policy" ON public.bank_accounts;
CREATE POLICY "Bank accounts isolation policy" ON public.bank_accounts
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Customers
DROP POLICY IF EXISTS "Customers isolation policy" ON public.customers;
CREATE POLICY "Customers isolation policy" ON public.customers
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Products
DROP POLICY IF EXISTS "Products isolation policy" ON public.products;
CREATE POLICY "Products isolation policy" ON public.products
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Invoices
DROP POLICY IF EXISTS "Invoices isolation policy" ON public.invoices;
CREATE POLICY "Invoices isolation policy" ON public.invoices
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Invoice Items
DROP POLICY IF EXISTS "Invoice items isolation policy" ON public.invoice_items;
CREATE POLICY "Invoice items isolation policy" ON public.invoice_items
    FOR ALL
    USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.get_auth_org_id()))
    WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.get_auth_org_id()));

-- Payments
DROP POLICY IF EXISTS "Payments isolation policy" ON public.payments;
CREATE POLICY "Payments isolation policy" ON public.payments
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Billing Letters
DROP POLICY IF EXISTS "Billing letters isolation policy" ON public.billing_letters;
CREATE POLICY "Billing letters isolation policy" ON public.billing_letters
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Documents
DROP POLICY IF EXISTS "Documents isolation policy" ON public.documents;
CREATE POLICY "Documents isolation policy" ON public.documents
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- Audit Logs
DROP POLICY IF EXISTS "Audit logs isolation policy" ON public.audit_logs;
CREATE POLICY "Audit logs isolation policy" ON public.audit_logs
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());


-- BillingFlow v8: operational business documents
-- Quotation -> PO -> Sales Order -> Delivery Order -> BAST
-- Run after v7. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('quotation','purchase_order','sales_order','delivery_order','bast')),
  document_number VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  date DATE NOT NULL,
  valid_until DATE,
  reference_number VARCHAR(150),
  parent_document_id UUID REFERENCES public.business_documents(id) ON DELETE SET NULL,
  delivery_address TEXT,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','approved','rejected','confirmed','shipped','delivered','completed','cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, document_number)
);

CREATE INDEX IF NOT EXISTS idx_business_documents_org_date ON public.business_documents(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_business_documents_org_type ON public.business_documents(organization_id, document_type);
CREATE INDEX IF NOT EXISTS idx_business_documents_parent ON public.business_documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_business_documents_customer ON public.business_documents(organization_id, customer_id);

ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS business_documents_select ON public.business_documents;
DROP POLICY IF EXISTS business_documents_insert ON public.business_documents;
DROP POLICY IF EXISTS business_documents_update ON public.business_documents;
DROP POLICY IF EXISTS business_documents_delete ON public.business_documents;
CREATE POLICY business_documents_select ON public.business_documents FOR SELECT USING (organization_id = public.get_auth_org_id());
CREATE POLICY business_documents_insert ON public.business_documents FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());
CREATE POLICY business_documents_update ON public.business_documents FOR UPDATE USING (organization_id = public.get_auth_org_id()) WITH CHECK (organization_id = public.get_auth_org_id());
CREATE POLICY business_documents_delete ON public.business_documents FOR DELETE USING (organization_id = public.get_auth_org_id());


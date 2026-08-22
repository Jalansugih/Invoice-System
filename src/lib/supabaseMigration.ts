export const SUPABASE_SQL_MIGRATION = `-- =========================================================================
-- BILLINGFLOW SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Multi-Tenant Financial ERP, Invoicing, Billing Letters, Payments & DJP Tax
-- Strict Row Level Security (RLS) & Role-Based Access Control (RBAC)
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. CORE MULTI-TENANT TABLES
-- =========================================================================

-- 2.1 Organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 2.2 User Profiles & Organization Membership
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'finance' CHECK (role IN ('owner', 'admin', 'finance', 'staff', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    branch VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Customers / Klien
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 2.5 Products & Services Master
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 2.6 Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_invoice_number UNIQUE (organization_id, invoice_number)
);

-- 2.7 Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 2.8 Payments & Cash Receipts (Kuitansi)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_payment_number UNIQUE (organization_id, payment_number)
);

-- 2.9 Surat Tagihan / Dunning Notices (SP 1, SP 2, SP 3 Somasi)
CREATE TABLE IF NOT EXISTS public.billing_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    letter_number VARCHAR(100) NOT NULL,
    letter_type VARCHAR(50) NOT NULL CHECK (letter_type IN ('first_reminder', 'second_warning', 'final_demand', 'sp1', 'sp2', 'sp3', 'somasi', 'pemberitahuan')),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    letter_date DATE NOT NULL,
    invoice_due_date DATE NOT NULL,
    overdue_days INT NOT NULL DEFAULT 0,
    total_invoice_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    outstanding_amount NUMERIC(15,2) NOT NULL,
    penalties_amount NUMERIC(15,2) DEFAULT 0,
    extended_due_date DATE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_letter_number UNIQUE (organization_id, letter_number)
);

-- 2.10 Document Center Archive
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'billing_letter', 'payment_receipt', 'purchase_order', 'quotation', 'other')),
    document_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    reference_id UUID,
    amount NUMERIC(15,2),
    date DATE NOT NULL,
    status VARCHAR(50),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Bank Transactions & Bank Feed
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL,
    value_date DATE,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('CR', 'DB')),
    reference_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'reconciled', 'ignored')),
    matched_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    matched_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    match_confidence NUMERIC(5,2),
    match_reason TEXT,
    reconciled_at TIMESTAMPTZ,
    reconciled_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 Audit Logs (Immutable Compliance Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =========================================================================
-- 3. INDEXES FOR HIGH-THROUGHPUT PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON public.invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_invoice ON public.payments(organization_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_letters_org ON public.billing_letters(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_org_status ON public.bank_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON public.audit_logs(organization_id, timestamp DESC);

-- =========================================================================
-- 4. HELPER SECURITY FUNCTIONS (MULTI-TENANT ISOLATION)
-- =========================================================================

-- Function to get the organization_id of current authenticated user
CREATE OR REPLACE FUNCTION public.auth_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to get the role of current authenticated user
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) - STRICT TENANT & ROLE POLICIES
-- =========================================================================

-- Enable RLS across all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles RLS
CREATE POLICY "Users can read own profile or profile in same org"
ON public.profiles FOR SELECT
USING (id = auth.uid() OR organization_id = public.auth_org_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert their initial profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- 5.2 Organizations RLS
CREATE POLICY "Members can view their own organization"
ON public.organizations FOR SELECT
USING (id = public.auth_org_id());

CREATE POLICY "Owners and Admins can update their organization"
ON public.organizations FOR UPDATE
USING (id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

CREATE POLICY "Authenticated users can create organization"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5.3 Multi-Tenant Standard Policies Helper Function Template for Tenants
-- Customers
CREATE POLICY "Tenant isolation: customers SELECT"
ON public.customers FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: customers INSERT"
ON public.customers FOR INSERT
WITH CHECK (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: customers UPDATE"
ON public.customers FOR UPDATE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: customers DELETE"
ON public.customers FOR DELETE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

-- Products
CREATE POLICY "Tenant isolation: products SELECT"
ON public.products FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: products INSERT"
ON public.products FOR INSERT
WITH CHECK (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: products UPDATE"
ON public.products FOR UPDATE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance'));

CREATE POLICY "Tenant isolation: products DELETE"
ON public.products FOR DELETE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

-- Invoices
CREATE POLICY "Tenant isolation: invoices SELECT"
ON public.invoices FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: invoices INSERT"
ON public.invoices FOR INSERT
WITH CHECK (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: invoices UPDATE"
ON public.invoices FOR UPDATE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: invoices DELETE"
ON public.invoices FOR DELETE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

-- Invoice Line Items (Inherits through invoice_id)
CREATE POLICY "Tenant isolation: invoice_items SELECT"
ON public.invoice_items FOR SELECT
USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.auth_org_id()));

CREATE POLICY "Tenant isolation: invoice_items INSERT"
ON public.invoice_items FOR INSERT
WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.auth_org_id()) AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: invoice_items UPDATE"
ON public.invoice_items FOR UPDATE
USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.auth_org_id()) AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: invoice_items DELETE"
ON public.invoice_items FOR DELETE
USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id = public.auth_org_id()) AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

-- Payments
CREATE POLICY "Tenant isolation: payments SELECT"
ON public.payments FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: payments INSERT"
ON public.payments FOR INSERT
WITH CHECK (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance'));

CREATE POLICY "Tenant isolation: payments UPDATE"
ON public.payments FOR UPDATE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance'));

CREATE POLICY "Tenant isolation: payments DELETE"
ON public.payments FOR DELETE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

-- Billing Letters
CREATE POLICY "Tenant isolation: billing_letters SELECT"
ON public.billing_letters FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: billing_letters INSERT"
ON public.billing_letters FOR INSERT
WITH CHECK (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: billing_letters UPDATE"
ON public.billing_letters FOR UPDATE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: billing_letters DELETE"
ON public.billing_letters FOR DELETE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

-- Documents
CREATE POLICY "Tenant isolation: documents SELECT"
ON public.documents FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: documents INSERT"
ON public.documents FOR INSERT
WITH CHECK (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance', 'staff'));

CREATE POLICY "Tenant isolation: documents DELETE"
ON public.documents FOR DELETE
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin'));

-- Bank Transactions
CREATE POLICY "Tenant isolation: bank_transactions SELECT"
ON public.bank_transactions FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: bank_transactions ALL"
ON public.bank_transactions FOR ALL
USING (organization_id = public.auth_org_id() AND public.auth_user_role() IN ('owner', 'admin', 'finance'));

-- Audit Logs
CREATE POLICY "Tenant isolation: audit_logs SELECT"
ON public.audit_logs FOR SELECT
USING (organization_id = public.auth_org_id());

CREATE POLICY "Tenant isolation: audit_logs INSERT"
ON public.audit_logs FOR INSERT
WITH CHECK (organization_id = public.auth_org_id());

-- =========================================================================
-- 6. AUTOMATED DATABASE TRIGGERS (BALANCE RECALCULATION & COMPLIANCE)
-- =========================================================================

-- Trigger to update customer balances when invoice or payment changes
CREATE OR REPLACE FUNCTION public.fn_sync_customer_balances()
RETURNS TRIGGER AS $$
DECLARE
    target_customer_id UUID;
BEGIN
    target_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
    
    UPDATE public.customers
    SET 
        total_invoiced = COALESCE((SELECT SUM(grand_total) FROM public.invoices WHERE customer_id = target_customer_id AND status != 'cancelled'), 0),
        total_paid = COALESCE((SELECT SUM(amount) FROM public.payments WHERE customer_id = target_customer_id), 0),
        total_outstanding = COALESCE((SELECT SUM(outstanding_amount) FROM public.invoices WHERE customer_id = target_customer_id AND status NOT IN ('paid', 'cancelled')), 0),
        updated_at = NOW()
    WHERE id = target_customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_customer_balance_invoice ON public.invoices;
CREATE TRIGGER trg_customer_balance_invoice
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_customer_balances();

DROP TRIGGER IF EXISTS trg_customer_balance_payment ON public.payments;
CREATE TRIGGER trg_customer_balance_payment
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_customer_balances();
`;

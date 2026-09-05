/**
 * PostgreSQL Database Schema & Supabase Multi-Tenant Definitions
 * 
 * Supports Row Level Security (RLS) policies scoped by `organization_id` (tenant)
 * and `auth.users(id)` (user profile).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DbOrganizationType = 'pt' | 'cv' | 'firma' | 'koperasi' | 'yayasan' | 'ud' | 'perorangan' | 'instansi' | 'other';

export type DbUserRole = 'owner' | 'admin' | 'finance' | 'staff' | 'viewer';

export type DbInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type DbPaymentMethod =
  | 'bank_transfer'
  | 'cash'
  | 'qris'
  | 'virtual_account'
  | 'giro_cek'
  | 'e_wallet'
  | 'other';

export type DbBillingLetterType =
  | 'sp1'
  | 'sp2'
  | 'sp3'
  | 'somasi'
  | 'pemberitahuan'
  | 'first_reminder'
  | 'second_warning'
  | 'final_demand';

export type DbDocumentType =
  | 'invoice'
  | 'billing_letter'
  | 'payment_receipt'
  | 'purchase_order'
  | 'quotation'
  | 'sales_order'
  | 'delivery_order'
  | 'bast'
  | 'credit_note'
  | 'debit_note'
  | 'other';

export type DbDiscountType = 'percentage' | 'fixed';

export type DbTaxType =
  | 'PPN'
  | 'PPh21'
  | 'PPh22'
  | 'PPh23'
  | 'PPh25'
  | 'PPh26'
  | 'PPhFinal'
  | 'PPhBadan';

// ============================================================================
// 1. DATABASE SCHEMA CONTRACT
// ============================================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      bank_accounts: {
        Row: BankAccountRow;
        Insert: BankAccountInsert;
        Update: BankAccountUpdate;
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [];
      };
      invoices: {
        Row: InvoiceRow;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
        Relationships: [];
      };
      invoice_items: {
        Row: InvoiceItemRow;
        Insert: InvoiceItemInsert;
        Update: InvoiceItemUpdate;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
        Relationships: [];
      };
      billing_letters: {
        Row: BillingLetterRow;
        Insert: BillingLetterInsert;
        Update: BillingLetterUpdate;
        Relationships: [];
      };
      documents: {
        Row: DocumentRow;
        Insert: DocumentInsert;
        Update: DocumentUpdate;
        Relationships: [];
      };
      business_documents: {
        Row: BusinessDocumentRow;
        Insert: BusinessDocumentInsert;
        Update: BusinessDocumentUpdate;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: AuditLogInsert;
        Update: AuditLogUpdate;
        Relationships: [];
      };
      bank_transactions: {
        Row: BankTransactionRow;
        Insert: BankTransactionInsert;
        Update: BankTransactionUpdate;
        Relationships: [];
      };
      tax_transactions: {
        Row: TaxTransactionRow;
        Insert: TaxTransactionInsert;
        Update: TaxTransactionUpdate;
        Relationships: [];
      };
      accounts: { Row: AccountRow; Insert: AccountInsert; Update: AccountUpdate; Relationships: []; };
      expense_transactions: { Row: ExpenseTransactionRow; Insert: ExpenseTransactionInsert; Update: ExpenseTransactionUpdate; Relationships: []; };
      expense_items: { Row: ExpenseItemRow; Insert: ExpenseItemInsert; Update: ExpenseItemUpdate; Relationships: []; };
      expense_payments: { Row: ExpensePaymentRow; Insert: ExpensePaymentInsert; Update: ExpensePaymentUpdate; Relationships: []; };
      journal_entries: { Row: JournalEntryRow; Insert: JournalEntryInsert; Update: JournalEntryUpdate; Relationships: []; };
      journal_lines: { Row: JournalLineRow; Insert: JournalLineInsert; Update: JournalLineUpdate; Relationships: []; };
      vendors: { Row: VendorRow; Insert: VendorInsert; Update: VendorUpdate; Relationships: []; };
      purchases: { Row: PurchaseRow; Insert: PurchaseInsert; Update: PurchaseUpdate; Relationships: []; };
      purchase_items: { Row: PurchaseItemRow; Insert: PurchaseItemInsert; Update: PurchaseItemUpdate; Relationships: []; };
      purchase_payments: { Row: PurchasePaymentRow; Insert: PurchasePaymentInsert; Update: PurchasePaymentUpdate; Relationships: []; };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_org_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_next_sequence: {
        Args: { p_sequence_name: string; p_minimum_value?: number };
        Returns: number;
      };
      bootstrap_current_user_profile: {
        Args: { p_org_name?: string };
        Returns: ProfileRow & { organization_id: string };
      };
      record_purchase_atomic: {
        Args: { p_purchase_number: string; p_vendor_id?: string | null; p_vendor_name: string; p_purchase_date: string; p_due_date?: string | null; p_notes?: string | null; p_items: Json };
        Returns: Json;
      };
      record_purchase_payment_atomic: {
        Args: { p_purchase_id: string; p_payment_date: string; p_amount: number; p_payment_account_id: string; p_reference_number?: string | null; p_notes?: string | null; p_idempotency_key?: string | null };
        Returns: Json;
      };
      record_payment_atomic: {
        Args: {
          p_invoice_id: string;
          p_amount: number;
          p_payment_date: string;
          p_payment_method: string;
          p_destination_bank?: string | null;
          p_bank_account_id?: string | null;
          p_account_number?: string | null;
          p_reference_number?: string | null;
          p_notes?: string | null;
        };
        Returns: {
          payment_id: string;
          payment_number: string;
          receipt_number: string;
          document_id: string;
          invoice_id: string;
          invoice_number: string;
          customer_id: string;
          paid_amount: number;
          outstanding_amount: number;
          status: string;
          paid_at: string | null;
          destination_bank: string;
          received_by: string;
        };
      };
    };
    Enums: {
      organization_type: DbOrganizationType;
      user_role: DbUserRole;
      invoice_status: DbInvoiceStatus;
      payment_method: DbPaymentMethod;
      billing_letter_type: DbBillingLetterType;
      document_type: DbDocumentType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// 2. TABLE ROW, INSERT, UPDATE DEFINITIONS
// ============================================================================

/**
 * 2.1 Organizations Table (Tenant Unit)
 */
export type OrganizationRow = {
  id: string;
  organization_type: DbOrganizationType;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  npwp: string | null;
  website: string | null;
  signature_name: string | null;
  signature_role: string | null;
  signature_image: string | null;
  director_name: string | null;
  default_tax_rate: number;
  default_currency: string;
  timezone: string;
  invoice_format: string;
  billing_letter_format: string;
  payment_receipt_format: string;
  default_payment_terms_days: number;
  created_at: string;
  updated_at: string;
};

export type OrganizationInsert = {
  id?: string;
  organization_type?: DbOrganizationType;
  name: string;
  tagline?: string | null;
  logo_url?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  npwp?: string | null;
  website?: string | null;
  signature_name?: string | null;
  signature_role?: string | null;
  signature_image?: string | null;
  director_name?: string | null;
  default_tax_rate?: number;
  default_currency?: string;
  timezone?: string;
  invoice_format?: string;
  billing_letter_format?: string;
  payment_receipt_format?: string;
  default_payment_terms_days?: number;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationUpdate = {
  id?: string;
  organization_type?: DbOrganizationType;
  name?: string;
  tagline?: string | null;
  logo_url?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  npwp?: string | null;
  website?: string | null;
  signature_name?: string | null;
  signature_role?: string | null;
  signature_image?: string | null;
  director_name?: string | null;
  default_tax_rate?: number;
  default_currency?: string;
  timezone?: string;
  invoice_format?: string;
  billing_letter_format?: string;
  payment_receipt_format?: string;
  default_payment_terms_days?: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * 2.2 Profiles / Users Table (Multi-tenant User Scoping)
 */
export type ProfileRow = {
  id: string; // Foreign key to auth.users(id)
  organization_id: string | null; // Multi-tenant foreign key
  name: string;
  email: string;
  role: DbUserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  organization_id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: DbUserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = {
  id?: string;
  organization_id?: string | null;
  name?: string;
  email?: string;
  role?: DbUserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Alias for user definitions
 */
export type UserRow = ProfileRow;
export type UserInsert = ProfileInsert;
export type UserUpdate = ProfileUpdate;

/**
 * 2.3 Customers / Clients Table
 */
export type CustomerRow = {
  id: string;
  organization_id: string; // Multi-tenant RLS isolation key
  code: string;
  name: string;
  company_name: string;
  npwp: string | null;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  pic: string;
  pic_phone: string | null;
  notes: string | null;
  is_active: boolean;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = {
  id?: string;
  organization_id: string;
  code: string;
  name: string;
  company_name: string;
  npwp?: string | null;
  email: string;
  phone: string;
  address: string;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  pic: string;
  pic_phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
  total_invoiced?: number;
  total_paid?: number;
  total_outstanding?: number;
  created_at?: string;
  updated_at?: string;
};

export type CustomerUpdate = {
  id?: string;
  organization_id?: string;
  code?: string;
  name?: string;
  company_name?: string;
  npwp?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  pic?: string;
  pic_phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
  total_invoiced?: number;
  total_paid?: number;
  total_outstanding?: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * Aliases for Clients schema
 */
export type ClientRow = CustomerRow;
export type ClientInsert = CustomerInsert;
export type ClientUpdate = CustomerUpdate;

export type AccountRow = { id:string; organization_id:string; code:string; name:string; account_type:string; normal_balance:string; is_active:boolean; created_at:string; updated_at:string; };
export type AccountInsert = Partial<AccountRow> & { organization_id:string; code:string; name:string; account_type:string; normal_balance:string };
export type AccountUpdate = Partial<AccountRow>;
export type ExpenseTransactionRow = { id:string; organization_id:string; expense_number:string; transaction_date:string; vendor_name:string|null; description:string; due_date:string|null; notes:string|null; status:string; payment_status:string; payment_account_id:string|null; subtotal:number; tax_amount:number; total_amount:number; created_by:string|null; created_at:string; updated_at:string; expense_items?: ExpenseItemRow[]; };
export type ExpenseTransactionInsert = Partial<ExpenseTransactionRow> & { organization_id:string; expense_number:string; transaction_date:string; description:string };
export type ExpenseTransactionUpdate = Partial<ExpenseTransactionRow>;
export type ExpenseItemRow = { id:string; expense_id:string; account_id:string; description:string; quantity:number; unit_price:number; tax_rate:number; line_total:number; tax_amount:number; created_at:string };
export type ExpenseItemInsert = Partial<ExpenseItemRow> & { expense_id:string; account_id:string; description:string };
export type ExpenseItemUpdate = Partial<ExpenseItemRow>;
export type ExpensePaymentRow = { id:string; organization_id:string; expense_id:string; payment_date:string; amount:number; payment_account_id:string; reference_number:string|null; notes:string|null; journal_entry_id:string|null; created_by:string|null; created_at:string };
export type ExpensePaymentInsert = Partial<ExpensePaymentRow> & { organization_id:string; expense_id:string; payment_date:string; amount:number; payment_account_id:string };
export type ExpensePaymentUpdate = Partial<ExpensePaymentRow>;
export type JournalEntryRow = { id:string; organization_id:string; journal_number:string; journal_date:string; reference_type:string; reference_id:string; description:string; status:string; created_by:string|null; created_at:string; journal_lines?: JournalLineRow[] };
export type JournalEntryInsert = Partial<JournalEntryRow> & { organization_id:string; journal_number:string; journal_date:string; reference_type:string; reference_id:string; description:string };
export type JournalEntryUpdate = Partial<JournalEntryRow>;
export type JournalLineRow = { id:string; journal_entry_id:string; account_id:string; description:string; debit:number; credit:number };
export type JournalLineInsert = Partial<JournalLineRow> & { journal_entry_id:string; account_id:string; description:string };
export type JournalLineUpdate = Partial<JournalLineRow>;
export type VendorRow = { id:string; organization_id:string; code:string; name:string; contact_name:string|null; email:string|null; phone:string|null; address:string|null; is_active:boolean; created_at:string; };
export type VendorInsert = Partial<VendorRow> & { organization_id:string; code:string; name:string };
export type VendorUpdate = Partial<VendorRow>;
export type PurchaseRow = { id:string; organization_id:string; purchase_number:string; vendor_id:string|null; vendor_name:string; purchase_date:string; due_date:string|null; status:string; payment_status:string; total_amount:number; paid_amount:number; notes:string|null; journal_entry_id:string|null; received_at:string|null; created_by:string|null; created_at:string; updated_at:string; purchase_items?:PurchaseItemRow[]; purchase_payments?:PurchasePaymentRow[] };
export type PurchaseInsert = Partial<PurchaseRow> & { organization_id:string; purchase_number:string; vendor_name:string; purchase_date:string };
export type PurchaseUpdate = Partial<PurchaseRow>;
export type PurchaseItemRow = { id:string; organization_id:string; purchase_id:string; product_id:string; product_name:string; quantity:number; unit_cost:number; line_total:number };
export type PurchaseItemInsert = Partial<PurchaseItemRow> & { purchase_id:string; product_id:string; product_name:string; quantity:number; unit_cost:number; line_total:number };
export type PurchaseItemUpdate = Partial<PurchaseItemRow>;
export type PurchasePaymentRow = { id:string; organization_id:string; purchase_id:string; payment_date:string; amount:number; payment_account_id:string; reference_number:string|null; notes:string|null; journal_entry_id:string|null; created_by:string|null; created_at:string; idempotency_key?:string|null };
export type PurchasePaymentInsert = Partial<PurchasePaymentRow> & { organization_id:string; purchase_id:string; payment_date:string; amount:number; payment_account_id:string };
export type PurchasePaymentUpdate = Partial<PurchasePaymentRow>;

/**
 * 2.4 Products / Services Master Table
 */
export type ProductRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  price: number;
  tax_rate: number;
  is_active: boolean;
  track_inventory: boolean;
  cost_price: number;
  min_stock: number;
  stock_qty: number;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = {
  id?: string;
  organization_id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  unit?: string;
  price?: number;
  tax_rate?: number;
  is_active?: boolean;
  track_inventory?: boolean;
  cost_price?: number;
  min_stock?: number;
  stock_qty?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProductUpdate = {
  id?: string;
  organization_id?: string;
  code?: string;
  name?: string;
  category?: string;
  description?: string | null;
  unit?: string;
  price?: number;
  tax_rate?: number;
  is_active?: boolean;
  track_inventory?: boolean;
  cost_price?: number;
  min_stock?: number;
  stock_qty?: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * 2.5 Invoices Table
 */
export type InvoiceRow = {
  id: string;
  organization_id: string; // Multi-tenant RLS isolation key
  invoice_number: string;
  customer_id: string; // Foreign key to customers(id)
  issue_date: string;
  due_date: string;
  po_number: string | null;
  reference_number: string | null;
  notes: string | null;
  payment_terms: string | null;
  subtotal: number;
  discount_type: DbDiscountType;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  additional_charges: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  status: DbInvoiceStatus;
  bank_account_id: string | null;
  created_by: string | null; // Foreign key to auth.users(id)
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceInsert = {
  id?: string;
  organization_id: string;
  invoice_number: string;
  customer_id: string;
  issue_date: string;
  due_date: string;
  po_number?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  subtotal?: number;
  discount_type?: DbDiscountType;
  discount_value?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  additional_charges?: number;
  grand_total?: number;
  paid_amount?: number;
  outstanding_amount?: number;
  status?: DbInvoiceStatus;
  bank_account_id?: string | null;
  created_by?: string | null;
  sent_at?: string | null;
  viewed_at?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceUpdate = {
  id?: string;
  organization_id?: string;
  invoice_number?: string;
  customer_id?: string;
  issue_date?: string;
  due_date?: string;
  po_number?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  subtotal?: number;
  discount_type?: DbDiscountType;
  discount_value?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  additional_charges?: number;
  grand_total?: number;
  paid_amount?: number;
  outstanding_amount?: number;
  status?: DbInvoiceStatus;
  bank_account_id?: string | null;
  created_by?: string | null;
  sent_at?: string | null;
  viewed_at?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * 2.6 Invoice Items Table
 */
export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_code: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  tax_rate: number;
  amount: number;
  created_at: string;
};

export type InvoiceItemInsert = {
  id?: string;
  invoice_id: string;
  product_id?: string | null;
  product_code?: string | null;
  description: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
  amount: number;
  created_at?: string;
};

export type InvoiceItemUpdate = {
  id?: string;
  invoice_id?: string;
  product_id?: string | null;
  product_code?: string | null;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
  amount?: number;
  created_at?: string;
};

/**
 * 2.7 Payments / Payment Tracking Table
 */
export type PaymentRow = {
  id: string;
  organization_id: string; // Multi-tenant RLS isolation key
  payment_number: string;
  invoice_id: string; // Foreign key to invoices(id)
  customer_id: string; // Foreign key to customers(id)
  payment_date: string;
  amount: number;
  payment_method: DbPaymentMethod;
  destination_bank: string;
  account_number: string | null;
  reference_number: string | null;
  notes: string | null;
  received_by: string | null;
  receipt_number: string;
  created_by: string | null; // Foreign key to auth.users(id)
  created_at: string;
};

export type PaymentInsert = {
  id?: string;
  organization_id: string;
  payment_number: string;
  invoice_id: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  payment_method: DbPaymentMethod;
  destination_bank: string;
  account_number?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  received_by?: string | null;
  receipt_number: string;
  created_by?: string | null;
  created_at?: string;
};

export type PaymentUpdate = {
  id?: string;
  organization_id?: string;
  payment_number?: string;
  invoice_id?: string;
  customer_id?: string;
  payment_date?: string;
  amount?: number;
  payment_method?: DbPaymentMethod;
  destination_bank?: string;
  account_number?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  received_by?: string | null;
  receipt_number?: string;
  created_by?: string | null;
  created_at?: string;
};

/**
 * 2.8 Billing Letters Table (Surat Tagihan)
 */
export type BillingLetterRow = {
  id: string;
  organization_id: string;
  letter_number: string;
  letter_type: DbBillingLetterType;
  invoice_id: string;
  customer_id: string;
  letter_date: string;
  invoice_due_date: string;
  overdue_days: number;
  total_invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  extended_due_date: string;
  subject: string;
  body_text: string;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export type BillingLetterInsert = {
  id?: string;
  organization_id: string;
  letter_number: string;
  letter_type: DbBillingLetterType;
  invoice_id: string;
  customer_id: string;
  letter_date: string;
  invoice_due_date: string;
  overdue_days?: number;
  total_invoice_amount: number;
  paid_amount?: number;
  outstanding_amount: number;
  extended_due_date: string;
  subject: string;
  body_text: string;
  status?: string;
  sent_at?: string | null;
  created_at?: string;
};

export type BillingLetterUpdate = {
  id?: string;
  organization_id?: string;
  letter_number?: string;
  letter_type?: DbBillingLetterType;
  invoice_id?: string;
  customer_id?: string;
  letter_date?: string;
  invoice_due_date?: string;
  overdue_days?: number;
  total_invoice_amount?: number;
  paid_amount?: number;
  outstanding_amount?: number;
  extended_due_date?: string;
  subject?: string;
  body_text?: string;
  status?: string;
  sent_at?: string | null;
  created_at?: string;
};

/**
 * 2.9 Bank Accounts Table
 */
export type BankAccountRow = {
  id: string;
  organization_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string | null;
  is_default: boolean;
  created_at: string;
};

export type BankAccountInsert = {
  id?: string;
  organization_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch?: string | null;
  is_default?: boolean;
  created_at?: string;
};

export type BankAccountUpdate = {
  id?: string;
  organization_id?: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  branch?: string | null;
  is_default?: boolean;
  created_at?: string;
};

/**
 * 2.10 Documents Table (Archive Hub)
 */
export type DocumentRow = {
  id: string;
  organization_id: string;
  title: string;
  document_type: DbDocumentType;
  document_number: string;
  customer_id: string | null;
  reference_id: string | null;
  amount: number | null;
  date: string;
  status: string | null;
  file_url: string | null;
  parent_document_id: string | null;
  created_at: string;
};

export type DocumentInsert = {
  id?: string;
  organization_id: string;
  title: string;
  document_type: DbDocumentType;
  document_number: string;
  customer_id?: string | null;
  reference_id?: string | null;
  amount?: number | null;
  date: string;
  status?: string | null;
  file_url?: string | null;
  parent_document_id?: string | null;
  created_at?: string;
};

export type DocumentUpdate = {
  id?: string;
  organization_id?: string;
  title?: string;
  document_type?: DbDocumentType;
  document_number?: string;
  customer_id?: string | null;
  reference_id?: string | null;
  amount?: number | null;
  date?: string;
  status?: string | null;
  file_url?: string | null;
  parent_document_id?: string | null;
  created_at?: string;
};

export type BusinessDocumentRow = {
  id: string; organization_id: string; document_type: DbDocumentType; document_number: string; title: string;
  customer_id: string | null; customer_name: string | null; date: string; valid_until: string | null;
  reference_number: string | null; parent_document_id: string | null; delivery_address: string | null; notes: string | null;
  status: string; items: Json; subtotal: number; tax_amount: number; grand_total: number; created_at: string; updated_at: string;
};
export type BusinessDocumentInsert = Partial<Omit<BusinessDocumentRow, 'id' | 'organization_id'>> & { id?: string; organization_id: string; document_type: DbDocumentType; document_number: string; title: string; date: string };
export type BusinessDocumentUpdate = Partial<BusinessDocumentRow>;

export type DbAuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'send'
  | 'pay'
  | 'cancel'
  | 'status_change'
  | 'reconcile';

export type DbAuditModule =
  | 'invoices'
  | 'payments'
  | 'customers'
  | 'billing_letters'
  | 'products'
  | 'settings'
  | 'auth'
  | 'reconciliation'
  | 'documents'
  | 'business_documents'
  | 'expenses'
  | 'vendors'
  | 'purchases';

/**
 * 2.11 Audit Logs Table
 */
export type AuditLogRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  user_name: string;
  user_role: DbUserRole;
  action: DbAuditAction;
  module: DbAuditModule;
  record_id: string;
  record_title: string;
  details: string;
  timestamp: string;
};

export type AuditLogInsert = {
  id?: string;
  organization_id: string;
  user_id?: string | null;
  user_name: string;
  user_role: DbUserRole;
  action: DbAuditAction;
  module: DbAuditModule;
  record_id: string;
  record_title: string;
  details: string;
  timestamp?: string;
};

export type AuditLogUpdate = {
  id?: string;
  organization_id?: string;
  user_id?: string | null;
  user_name?: string;
  user_role?: DbUserRole;
  action?: DbAuditAction;
  module?: DbAuditModule;
  record_id?: string;
  record_title?: string;
  details?: string;
  timestamp?: string;
};

/**
 * 2.12 Bank Transactions Table (Reconciliation)
 */
export type BankTransactionRow = {
  id: string;
  organization_id: string;
  bank_name: string;
  account_number: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  reference_number: string | null;
  is_reconciled: boolean;
  reconciled_with_type: string | null;
  reconciled_with_id: string | null;
  reconciled_with_number: string | null;
  reconciled_at: string | null;
  match_confidence: number | null;
  created_at: string;
};

export type BankTransactionInsert = {
  id?: string;
  organization_id: string;
  bank_name: string;
  account_number: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  reference_number?: string | null;
  is_reconciled?: boolean;
  reconciled_with_type?: string | null;
  reconciled_with_id?: string | null;
  reconciled_with_number?: string | null;
  reconciled_at?: string | null;
  match_confidence?: number | null;
  created_at?: string;
};

export type BankTransactionUpdate = {
  id?: string;
  organization_id?: string;
  bank_name?: string;
  account_number?: string;
  date?: string;
  description?: string;
  type?: 'credit' | 'debit';
  amount?: number;
  reference_number?: string | null;
  is_reconciled?: boolean;
  reconciled_with_type?: string | null;
  reconciled_with_id?: string | null;
  reconciled_with_number?: string | null;
  reconciled_at?: string | null;
  match_confidence?: number | null;
  created_at?: string;
};

/**
 * 2.13 Tax Transactions Table (DJP Pajak)
 */
export type TaxTransactionRow = {
  id: string;
  organization_id: string;
  transaction_number: string;
  tax_type: DbTaxType;
  tax_code: string;
  tax_rate: number;
  period_year: number;
  period_month: number;
  transaction_date: string;
  tax_invoice_number: string | null;
  tax_invoice_type: string | null;
  withholding_slip_number: string | null;
  source_type: string;
  source_id: string | null;
  source_doc_number: string;
  party_type: string;
  party_id: string | null;
  party_name: string;
  party_npwp: string | null;
  party_nik: string | null;
  party_address: string | null;
  dpp_amount: number;
  tax_amount: number;
  gross_amount: number;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TaxTransactionInsert = {
  id?: string;
  organization_id: string;
  transaction_number: string;
  tax_type: DbTaxType;
  tax_code: string;
  tax_rate: number;
  period_year: number;
  period_month: number;
  transaction_date: string;
  tax_invoice_number?: string | null;
  tax_invoice_type?: string | null;
  withholding_slip_number?: string | null;
  source_type: string;
  source_id?: string | null;
  source_doc_number: string;
  party_type: string;
  party_id?: string | null;
  party_name: string;
  party_npwp?: string | null;
  party_nik?: string | null;
  party_address?: string | null;
  dpp_amount: number;
  tax_amount: number;
  gross_amount: number;
  status?: string;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TaxTransactionUpdate = {
  id?: string;
  organization_id?: string;
  transaction_number?: string;
  tax_type?: DbTaxType;
  tax_code?: string;
  tax_rate?: number;
  period_year?: number;
  period_month?: number;
  transaction_date?: string;
  tax_invoice_number?: string | null;
  tax_invoice_type?: string | null;
  withholding_slip_number?: string | null;
  source_type?: string;
  source_id?: string | null;
  source_doc_number?: string;
  party_type?: string;
  party_id?: string | null;
  party_name?: string;
  party_npwp?: string | null;
  party_nik?: string | null;
  party_address?: string | null;
  dpp_amount?: number;
  tax_amount?: number;
  gross_amount?: number;
  status?: string;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ============================================================================
// 3. MULTI-TENANT RLS POLICIES & CONTEXT HELPERS
// ============================================================================

/**
 * Standard Multi-Tenant contract where all records belong to an organization
 */
export interface MultiTenantScoped {
  organization_id: string;
}

/**
 * User-authored tracking metadata
 */
export interface UserCreatedScoped {
  created_by?: string | null;
}

/**
 * RLS Context representing the authenticated actor executing queries
 */
export interface RLSContext {
  /** The Supabase auth user UID (`auth.uid()`) */
  userId: string;
  /** The tenant ID the user belongs to (`public.profiles.organization_id`) */
  organizationId: string;
  /** The role granted to the user within the tenant */
  role: DbUserRole;
  /** Optional email address of the authenticated actor */
  email?: string;
}

/**
 * Multi-Tenant Row Level Security (RLS) Policy Specifications
 * 
 * Used for database documentation, schema validation, and SQL generation:
 * - ORGANIZATIONS: Access restricted to members having matching profile organization_id.
 * - PROFILES: Users can view their own profile (id = auth.uid()) and peers within the same org.
 * - CUSTOMERS / CLIENTS: Restricted to rows where organization_id = current user's org.
 * - INVOICES: Restricted to rows where organization_id = current user's org.
 * - INVOICE_ITEMS: Cascaded via invoice_id -> invoices.organization_id.
 * - PAYMENTS: Restricted to rows where organization_id = current user's org.
 * - BILLING_LETTERS: Restricted to rows where organization_id = current user's org.
 * - BANK_ACCOUNTS: Restricted to rows where organization_id = current user's org.
 */
export interface RLSPolicyDefinition {
  tableName: keyof Database['public']['Tables'];
  policyName: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  usingClause: string;
  withCheckClause?: string;
}

export const MULTI_TENANT_RLS_POLICIES: RLSPolicyDefinition[] = [
  {
    tableName: 'profiles',
    policyName: 'Users can view own profile',
    command: 'SELECT',
    roles: ['authenticated'],
    usingClause: 'id = auth.uid()',
  },
  {
    tableName: 'profiles',
    policyName: 'Users can update own profile',
    command: 'UPDATE',
    roles: ['authenticated'],
    usingClause: 'id = auth.uid()',
  },
  {
    tableName: 'organizations',
    policyName: 'Members can view own organization',
    command: 'SELECT',
    roles: ['authenticated'],
    usingClause: 'id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'customers',
    policyName: 'Members can access own customers',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
    withCheckClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'invoices',
    policyName: 'Members can access own invoices',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
    withCheckClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'invoice_items',
    policyName: 'Members can access own invoice items',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))',
  },
  {
    tableName: 'payments',
    policyName: 'Members can access own payments',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
    withCheckClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'billing_letters',
    policyName: 'Members can access own billing letters',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
    withCheckClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'bank_accounts',
    policyName: 'Members can access own bank accounts',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'documents',
    policyName: 'Members can access own documents',
    command: 'ALL',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
  {
    tableName: 'audit_logs',
    policyName: 'Members can view own audit logs',
    command: 'SELECT',
    roles: ['authenticated'],
    usingClause: 'organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())',
  },
];

// ============================================================================
// 4. SUPABASE TYPE HELPER UTILITIES
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

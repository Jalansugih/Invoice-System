import { supabase, isSupabaseConfigured } from './supabase';
import {
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  Payment,
  BillingLetter,
  DocumentItem,
  AuditLog,
  Organization,
  UserProfile,
  UserRole,
  BankTransaction,
  BankAccount,
  BusinessDocument,
} from '../types';

export interface MigrationResult {
  success: boolean;
  message: string;
  counts: {
    organizations: number;
    customers: number;
    products: number;
    invoices: number;
    invoiceItems: number;
    payments: number;
    billingLetters: number;
    documents: number;
    auditLogs: number;
    bankTransactions: number;
  };
  errors: string[];
}

export class SupabaseService {
  /**
   * Atomically reserves the next number in a per-organization sequence
   * (invoice, payment, receipt, billingLetter, customer, product, ...) via
   * the `get_next_sequence` Postgres function (see
   * supabase/migration_v4_atomic_sequences.sql). This is safe against two
   * devices/tabs generating the same document number at the same time,
   * unlike the plain `localStorage` counter this replaces.
   *
   * `localMinimum` should be the caller's current local sequence value, so
   * the very first call for a brand-new cloud counter doesn't restart from
   * 1 and collide with numbers already used locally/historically.
   *
   * Returns null (instead of throwing) when Supabase isn't configured/
   * reachable or the RPC doesn't exist yet (e.g. migration_v4 hasn't been
   * run) - callers should fall back to the local-only counter in that case.
   */
  public static async getNextSequence(sequenceName: string, localMinimum: number): Promise<number | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.rpc('get_next_sequence', {
        p_sequence_name: sequenceName,
        p_minimum_value: localMinimum,
      });
      if (error) throw error;
      return typeof data === 'number' ? data : null;
    } catch (e) {
      console.error(`Supabase getNextSequence(${sequenceName}) error:`, e);
      return null;
    }
  }

  /**
   * Records a payment as one atomic database transaction: inserts the
   * payment row, updates the invoice's paid/outstanding/status, archives
   * the kuitansi document, and writes the audit log entry - all inside a
   * single Postgres function (see supabase/migration_v5_atomic_payment.sql).
   * Returns null if Supabase isn't configured/reachable or the RPC
   * doesn't exist yet (e.g. migration_v5 not run), so the caller can fall
   * back to the local-only flow.
   */
  public static async recordPaymentAtomic(payload: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    destinationBank?: string;
    bankAccountId?: string;
    accountNumber?: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<{
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
  } | null> {
    if (!isSupabaseConfigured) return null;
    try {
      // Demo/local-only mode has isSupabaseConfigured=true (env keys are
      // set) but no real Supabase auth session (signInDemoUser never calls
      // supabase.auth.*). Without this check, the RPC would run under no
      // authenticated user and get_auth_org_id() would raise, which we'd
      // otherwise mistake for a real validation error.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return null;

      const { data, error } = await supabase.rpc('record_payment_atomic', {
        p_invoice_id: payload.invoiceId,
        p_amount: payload.amount,
        p_payment_date: payload.paymentDate,
        p_payment_method: payload.paymentMethod,
        p_destination_bank: payload.destinationBank ?? null,
        p_bank_account_id: payload.bankAccountId ?? null,
        p_account_number: payload.accountNumber ?? null,
        p_reference_number: payload.referenceNumber ?? null,
        p_notes: payload.notes ?? null,
      });
      if (error) throw error;
      return data ?? null;
    } catch (e: any) {
      // Surface validation errors (e.g. "Nominal pembayaran melebihi sisa
      // tagihan...") raised by the SQL function so the caller can show
      // them to the user, instead of silently swallowing and falling
      // back to a local write that would duplicate the payment.
      const msg: string = e?.message || '';
      if (msg.includes('Nominal pembayaran') || msg.includes('Invoice tidak ditemukan') || msg.includes('organisasi')) {
        throw new Error(msg);
      }
      console.error('Supabase recordPaymentAtomic error:', e);
      return null;
    }
  }

  /**
   * Health check for Supabase database connection and authentication
   */
  public static async checkConnection(): Promise<{
    connected: boolean;
    authenticated: boolean;
    userEmail?: string;
    organizationId?: string;
    error?: string;
  }> {
    if (!isSupabaseConfigured) {
      return {
        connected: false,
        authenticated: false,
        error: 'Supabase URL atau Anon Key belum dikonfigurasi pada environment variable.',
      };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        return {
          connected: true,
          authenticated: false,
          error: authError?.message || 'Pengguna belum login.',
        };
      }

      // Test query to organizations or customers
      const { data, error: dbError } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1);

      if (dbError) {
        return {
          connected: false,
          authenticated: true,
          userEmail: authData.user.email,
          error: dbError.message,
        };
      }

      return {
        connected: true,
        authenticated: true,
        userEmail: authData.user.email,
        organizationId: data?.[0]?.id,
      };
    } catch (err: any) {
      return {
        connected: false,
        authenticated: false,
        error: err.message || 'Gagal tersambung ke Supabase server.',
      };
    }
  }

  // =========================================================================
  // 1. ORGANIZATIONS & PROFILES
  // =========================================================================

  public static async getOrganization(orgId: string): Promise<Organization | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError || !orgData) return null;

      const { data: bankData } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('organization_id', orgId);

      return {
        id: orgData.id,
        name: orgData.name,
        organizationType: (orgData.organization_type || 'pt') as Organization['organizationType'],
        tagline: orgData.tagline || '',
        logoUrl: orgData.logo_url || '',
        email: orgData.email,
        phone: orgData.phone || '',
        address: orgData.address || '',
        city: orgData.city || '',
        province: orgData.province || '',
        postalCode: orgData.postal_code || '',
        npwp: orgData.npwp || '',
        website: orgData.website || '',
        signatureName: orgData.signature_name || '',
        signatureRole: orgData.signature_role || '',
        signatureImage: orgData.signature_image || '',
        defaultTaxRate: Number(orgData.default_tax_rate) || 11,
        defaultCurrency: orgData.default_currency || 'IDR',
        timezone: orgData.timezone || 'Asia/Jakarta',
        invoiceFormat: orgData.invoice_format || 'INV/{YEAR}/{MONTH}/{NUMBER}',
        billingLetterFormat: orgData.billing_letter_format || 'ST/{YEAR}/{MONTH}/{NUMBER}',
        paymentReceiptFormat: orgData.payment_receipt_format || 'KWT/{YEAR}/{MONTH}/{NUMBER}',
        defaultPaymentTermsDays: orgData.default_payment_terms_days || 14,
        bankAccounts: (bankData || []).map((b) => ({
          id: b.id,
          bankName: b.bank_name,
          accountNumber: b.account_number,
          accountHolder: b.account_holder,
          branch: b.branch || '',
          isDefault: Boolean(b.is_default),
        })),
      };
    } catch (e) {
      console.error('Supabase getOrganization error:', e);
      return null;
    }
  }

  public static async saveOrganization(org: Organization): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('organizations').upsert({
        id: org.id,
        name: org.name,
        organization_type: org.organizationType || 'pt',
        tagline: org.tagline,
        logo_url: org.logoUrl,
        email: org.email,
        phone: org.phone,
        address: org.address,
        city: org.city,
        province: org.province,
        postal_code: org.postalCode,
        npwp: org.npwp,
        website: org.website,
        signature_name: org.signatureName,
        signature_role: org.signatureRole,
        signature_image: org.signatureImage,
        default_tax_rate: org.defaultTaxRate,
        default_currency: org.defaultCurrency,
        timezone: org.timezone,
        invoice_format: org.invoiceFormat,
        billing_letter_format: org.billingLetterFormat,
        payment_receipt_format: org.paymentReceiptFormat,
        default_payment_terms_days: org.defaultPaymentTermsDays,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to save organization in Supabase:', error);
        return false;
      }

      // Upsert bank accounts
      if (org.bankAccounts && org.bankAccounts.length > 0) {
        const bankPayload = org.bankAccounts.map((b) => ({
          id: b.id,
          organization_id: org.id,
          bank_name: b.bankName,
          account_number: b.accountNumber,
          account_holder: b.accountHolder,
          branch: b.branch,
          is_default: b.isDefault,
        }));
        await supabase.from('bank_accounts').upsert(bankPayload);
      }

      return true;
    } catch (e) {
      console.error('Supabase saveOrganization exception:', e);
      return false;
    }
  }

  // =========================================================================
  // 2. CUSTOMERS
  // =========================================================================

  public static async fetchCustomers(orgId: string): Promise<Customer[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        companyName: c.company_name,
        npwp: c.npwp || '',
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city || '',
        province: c.province || '',
        postalCode: c.postal_code || '',
        pic: c.pic,
        picPhone: c.pic_phone || '',
        notes: c.notes || '',
        isActive: Boolean(c.is_active),
        createdAt: c.created_at,
        totalInvoiced: Number(c.total_invoiced) || 0,
        totalPaid: Number(c.total_paid) || 0,
        totalOutstanding: Number(c.total_outstanding) || 0,
      }));
    } catch (e) {
      console.error('Supabase fetchCustomers error:', e);
      return [];
    }
  }

  public static async saveCustomer(customer: Customer, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('customers').upsert({
        id: customer.id,
        organization_id: orgId,
        code: customer.code,
        name: customer.name,
        company_name: customer.companyName,
        npwp: customer.npwp,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        province: customer.province,
        postal_code: customer.postalCode,
        pic: customer.pic,
        pic_phone: customer.picPhone,
        notes: customer.notes,
        is_active: customer.isActive,
        total_invoiced: customer.totalInvoiced,
        total_paid: customer.totalPaid,
        total_outstanding: customer.totalOutstanding,
        updated_at: new Date().toISOString(),
      });

      return !error;
    } catch (e) {
      console.error('Supabase saveCustomer error:', e);
      return false;
    }
  }

  public static async deleteCustomer(customerId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    return !error;
  }

  // =========================================================================
  // 3. PRODUCTS
  // =========================================================================

  public static async fetchProducts(orgId: string): Promise<Product[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        description: p.description || '',
        unit: p.unit || 'Unit',
        price: Number(p.price) || 0,
        taxRate: Number(p.tax_rate) || 11,
        isActive: Boolean(p.is_active),
        trackInventory: Boolean(p.track_inventory),
        costPrice: Number(p.cost_price) || 0,
        minStock: Number(p.min_stock) || 0,
        stockQty: Number(p.stock_qty) || 0,
      }));
    } catch (e) {
      console.error('Supabase fetchProducts error:', e);
      return [];
    }
  }

  public static async saveProduct(product: Product, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('products').upsert({
        id: product.id,
        organization_id: orgId,
        code: product.code,
        name: product.name,
        category: product.category,
        description: product.description,
        unit: product.unit,
        price: product.price,
        tax_rate: product.taxRate,
        is_active: product.isActive,
        track_inventory: product.trackInventory ?? false,
        cost_price: product.costPrice ?? 0,
        min_stock: product.minStock ?? 0,
        stock_qty: product.stockQty ?? 0,
        updated_at: new Date().toISOString(),
      });

      return !error;
    } catch (e) {
      console.error('Supabase saveProduct error:', e);
      return false;
    }
  }

  public static async adjustProductStock(productId: string, delta: number, note: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.rpc('adjust_product_stock_atomic' as any, {
      p_product_id: productId,
      p_delta: delta,
      p_movement_type: delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
      p_notes: note,
      p_movement_date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
    return true;
  }

  public static async recordInventoryReceipt(productId: string, quantity: number, unitCost: number, movementType: 'OPENING' | 'PURCHASE' | 'RETURN_IN' | 'ADJUSTMENT_IN', movementDate: string, referenceType?: string, referenceId?: string, notes?: string): Promise<any> {
    if (!isSupabaseConfigured) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return null;
    const { data, error } = await supabase.rpc('record_inventory_receipt_atomic' as any, {
      p_product_id: productId, p_quantity: quantity, p_unit_cost: unitCost,
      p_movement_type: movementType, p_movement_date: movementDate,
      p_reference_type: referenceType ?? null, p_reference_id: referenceId ?? null, p_notes: notes ?? null,
    });
    if (error) throw error;
    return data;
  }

  public static async repostInvoiceInventory(invoiceId: string): Promise<any> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.rpc('repost_invoice_inventory' as any, { p_invoice_id: invoiceId });
    if (error) throw error;
    return data;
  }

  public static async recordPurchaseAtomic(payload: {
    purchaseNumber: string; vendorId?: string; vendorName: string; purchaseDate: string; dueDate?: string; notes?: string;
    items: { productId: string; quantity: number; unitCost: number; productName?: string }[];
  }): Promise<any | null> {
    if (!isSupabaseConfigured) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return null;
    const { data, error } = await (supabase as any).rpc('record_purchase_atomic', {
      p_purchase_number: payload.purchaseNumber,
      p_vendor_id: payload.vendorId ?? null,
      p_vendor_name: payload.vendorName,
      p_purchase_date: payload.purchaseDate,
      p_due_date: payload.dueDate ?? null,
      p_notes: payload.notes ?? null,
      p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_cost: i.unitCost })),
    });
    if (error) throw error;
    return data ?? null;
  }

  public static async recordPurchasePaymentAtomic(payload: {
    purchaseId: string; amount: number; paymentDate: string; paymentAccountId: string; referenceNumber?: string; notes?: string; idempotencyKey?: string;
  }): Promise<any | null> {
    if (!isSupabaseConfigured) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return null;
    const { data, error } = await (supabase as any).rpc('record_purchase_payment_atomic', {
      p_purchase_id: payload.purchaseId,
      p_amount: payload.amount,
      p_payment_date: payload.paymentDate,
      p_payment_account_id: payload.paymentAccountId,
      p_reference_number: payload.referenceNumber ?? null,
      p_notes: payload.notes ?? null,
      p_idempotency_key: payload.idempotencyKey ?? null,
    });
    if (error) throw error;
    return data ?? null;
  }

  public static async fetchAccountingAccounts(orgId: string): Promise<any[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await (supabase as any).from('accounts')
        .select('id,code,name,account_type,normal_balance,is_active')
        .eq('organization_id', orgId).eq('is_active', true).order('code');
      if (error) throw error;
      return data || [];
    } catch (e) { console.error('Supabase fetchAccountingAccounts error:', e); return null; }
  }

  public static async fetchPurchases(orgId: string): Promise<any[] | null> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await (supabase as any).rpc('fetch_purchases_with_items');
      if (error) throw error;
      return Array.isArray(data) ? data.map((p:any) => ({
        id:p.id, purchaseNumber:p.purchase_number, vendorId:p.vendor_id || undefined, vendorName:p.vendor_name,
        purchaseDate:p.purchase_date, dueDate:p.due_date || undefined, status:p.status, paymentStatus:p.payment_status,
        totalAmount:Number(p.total_amount)||0, paidAmount:Number(p.paid_amount)||0, notes:p.notes || undefined,
        createdAt:p.created_at, updatedAt:p.updated_at,
        items:(p.items || []).map((i:any)=>({id:i.id,productId:i.product_id,productName:i.product_name,quantity:Number(i.quantity)||0,unitCost:Number(i.unit_cost)||0,lineTotal:Number(i.line_total)||0})),
        payments:(p.payments || []).map((x:any)=>({id:x.id,paymentDate:x.payment_date,amount:Number(x.amount)||0,paymentAccountId:x.payment_account_id,referenceNumber:x.reference_number||undefined,notes:x.notes||undefined,journalEntryId:x.journal_entry_id,createdAt:x.created_at}))
      })) : [];
    } catch (e) { console.error('Supabase fetchPurchases error:', e); return null; }
  }

  public static async fetchVendors(orgId: string): Promise<any[] | null> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await (supabase as any).from('vendors').select('*').eq('organization_id', orgId).order('name');
      if (error) throw error;
      return (data || []).map((v:any)=>({id:v.id,code:v.code,name:v.name,contactName:v.contact_name||undefined,email:v.email||undefined,phone:v.phone||undefined,address:v.address||undefined,isActive:Boolean(v.is_active),createdAt:v.created_at}));
    } catch (e) { console.error('Supabase fetchVendors error:', e); return null; }
  }

  public static async saveVendor(vendor:any, orgId:string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await (supabase as any).from('vendors').upsert({id:vendor.id,organization_id:orgId,code:vendor.code,name:vendor.name,contact_name:vendor.contactName||null,email:vendor.email||null,phone:vendor.phone||null,address:vendor.address||null,is_active:vendor.isActive!==false});
    if (error) throw error;
    return true;
  }

  public static async deleteProduct(productId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    return !error;
  }

  // =========================================================================
  // 4. INVOICES & INVOICE ITEMS
  // =========================================================================

  public static async fetchInvoices(orgId: string): Promise<Invoice[]> {
    if (!isSupabaseConfigured) return [];

    try {
      // Fetch invoices with nested customer and invoice_items
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            company_name,
            email,
            phone,
            address,
            npwp
          ),
          invoice_items (*)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      return (invData || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        customerId: inv.customer_id,
        customerName: inv.customers?.name || inv.customer_name || 'Customer',
        customerCompanyName: inv.customers?.company_name || inv.customer_company_name || '',
        customerEmail: inv.customers?.email || inv.customer_email || '',
        customerPhone: inv.customers?.phone || inv.customer_phone || '',
        customerAddress: inv.customers?.address || inv.customer_address || '',
        customerNpwp: inv.customers?.npwp || inv.customer_npwp || '',
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        poNumber: inv.po_number || '',
        referenceNumber: inv.reference_number || '',
        notes: inv.notes || '',
        paymentTerms: inv.payment_terms || '',
        subtotal: Number(inv.subtotal) || 0,
        discountType: inv.discount_type || 'fixed',
        discountValue: Number(inv.discount_value) || 0,
        discountAmount: Number(inv.discount_amount) || 0,
        // taxable_amount (DPP) bukan kolom tersendiri di Supabase - selalu
        // diturunkan dari subtotal - discountAmount, sama seperti storage.ts.
        taxableAmount: Math.max(0, (Number(inv.subtotal) || 0) - (Number(inv.discount_amount) || 0)),
        taxRate: Number(inv.tax_rate) || 11,
        taxAmount: Number(inv.tax_amount) || 0,
        additionalCharges: Number(inv.additional_charges) || 0,
        grandTotal: Number(inv.grand_total) || 0,
        paidAmount: Number(inv.paid_amount) || 0,
        outstandingAmount: Number(inv.outstanding_amount) || 0,
        status: inv.status,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at || inv.created_at,
        sentAt: inv.sent_at,
        viewedAt: inv.viewed_at,
        paidAt: inv.paid_at,
        bankAccountId: inv.bank_account_id,
        items: (inv.invoice_items || []).map((it: any) => ({
          id: it.id,
          productId: it.product_id,
          productCode: it.product_code,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'Unit',
          unitPrice: Number(it.unit_price) || 0,
          discount: Number(it.discount) || 0,
          taxRate: Number(it.tax_rate) || 11,
          amount: Number(it.amount) || 0,
        })),
      }));
    } catch (e) {
      console.error('Supabase fetchInvoices error:', e);
      return [];
    }
  }

  public static async saveInvoice(invoice: Invoice, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      // 1. Upsert Invoice header
      const { error: invError } = await supabase.from('invoices').upsert({
        id: invoice.id,
        organization_id: orgId,
        invoice_number: invoice.invoiceNumber,
        customer_id: invoice.customerId,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        po_number: invoice.poNumber,
        reference_number: invoice.referenceNumber,
        notes: invoice.notes,
        payment_terms: invoice.paymentTerms,
        subtotal: invoice.subtotal,
        discount_type: invoice.discountType,
        discount_value: invoice.discountValue,
        discount_amount: invoice.discountAmount,
        tax_rate: invoice.taxRate,
        tax_amount: invoice.taxAmount,
        additional_charges: invoice.additionalCharges,
        grand_total: invoice.grandTotal,
        paid_amount: invoice.paidAmount,
        outstanding_amount: invoice.outstandingAmount,
        status: invoice.status,
        sent_at: invoice.sentAt,
        viewed_at: invoice.viewedAt,
        paid_at: invoice.paidAt,
        bank_account_id: invoice.bankAccountId,
        updated_at: new Date().toISOString(),
      });

      if (invError) {
        console.error('Failed to save invoice in Supabase:', invError);
        return false;
      }

      // 2. Delete existing items and re-insert new items
      await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);

      if (invoice.items && invoice.items.length > 0) {
        const itemRows = invoice.items.map((it) => ({
          id: it.id,
          invoice_id: invoice.id,
          product_id: it.productId,
          product_code: it.productCode,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unitPrice,
          discount: it.discount,
          tax_rate: it.taxRate,
          amount: it.amount,
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows);
        if (itemsError) {
          console.error('Failed to save invoice_items:', itemsError);
        }
      }

      // Header triggers can run before invoice_items are replaced. Re-post after
      // the final item set so inventory/HPP always reflects the actual invoice.
      if (invoice.status !== 'draft' && invoice.status !== 'cancelled') {
        await this.repostInvoiceInventory(invoice.id);
      } else if (invoice.status === 'cancelled') {
        await this.repostInvoiceInventory(invoice.id);
      }

      return true;
    } catch (e) {
      console.error('Supabase saveInvoice exception:', e);
      return false;
    }
  }

  public static async deleteInvoice(invoiceId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    return !error;
  }

  // =========================================================================
  // 5. PAYMENTS
  // =========================================================================

  public static async fetchPayments(orgId: string): Promise<Payment[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices ( invoice_number ),
          customers ( name )
        `)
        .eq('organization_id', orgId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        paymentNumber: p.payment_number,
        invoiceId: p.invoice_id,
        invoiceNumber: p.invoices?.invoice_number || p.invoice_number || '',
        customerId: p.customer_id,
        customerName: p.customers?.name || p.customer_name || '',
        paymentDate: p.payment_date,
        amount: Number(p.amount) || 0,
        paymentMethod: p.payment_method,
        destinationBank: p.destination_bank,
        accountNumber: p.account_number || '',
        referenceNumber: p.reference_number || '',
        notes: p.notes || '',
        receivedBy: p.received_by || '',
        receiptNumber: p.receipt_number,
        createdAt: p.created_at,
      }));
    } catch (e) {
      console.error('Supabase fetchPayments error:', e);
      return [];
    }
  }

  public static async savePayment(payment: Payment, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('payments').upsert({
        id: payment.id,
        organization_id: orgId,
        payment_number: payment.paymentNumber,
        invoice_id: payment.invoiceId,
        customer_id: payment.customerId,
        payment_date: payment.paymentDate,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        destination_bank: payment.destinationBank,
        account_number: payment.accountNumber,
        reference_number: payment.referenceNumber,
        notes: payment.notes,
        received_by: payment.receivedBy,
        receipt_number: payment.receiptNumber,
      });

      return !error;
    } catch (e) {
      console.error('Supabase savePayment error:', e);
      return false;
    }
  }

  public static async deletePayment(paymentId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('payments').delete().eq('id', paymentId);
      return !error;
    } catch (e) {
      console.error('Supabase deletePayment error:', e);
      return false;
    }
  }

  // =========================================================================
  // 6. BILLING LETTERS (SURAT TAGIHAN)
  // =========================================================================

  public static async fetchBillingLetters(orgId: string): Promise<BillingLetter[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('billing_letters')
        .select(`
          *,
          invoices ( invoice_number, grand_total, paid_amount, outstanding_amount ),
          customers ( name, company_name, address, pic )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((l: any) => ({
        id: l.id,
        letterNumber: l.letter_number,
        letterType: l.letter_type,
        invoiceId: l.invoice_id,
        invoiceNumber: l.invoices?.invoice_number || l.invoice_number || '',
        customerId: l.customer_id,
        customerName: l.customers?.name || l.customer_name || '',
        customerCompanyName: l.customers?.company_name || l.customer_company_name || '',
        customerAddress: l.customers?.address || l.customer_address || '',
        customerPic: l.customers?.pic || l.customer_pic || '',
        letterDate: l.letter_date,
        invoiceDueDate: l.invoice_due_date,
        overdueDays: Number(l.overdue_days) || 0,
        totalInvoiceAmount: Number(l.total_invoice_amount) || 0,
        paidAmount: Number(l.paid_amount) || 0,
        outstandingAmount: Number(l.outstanding_amount) || 0,
        penaltiesAmount: Number(l.penalties_amount) || 0,
        paymentDeadline: l.payment_deadline || l.extended_due_date,
        extendedDueDate: l.extended_due_date,
        subject: l.subject,
        bodyText: l.body_text,
        status: l.status || 'sent',
        createdAt: l.created_at,
        sentAt: l.sent_at,
      }));
    } catch (e) {
      console.error('Supabase fetchBillingLetters error:', e);
      return [];
    }
  }

  public static async saveBillingLetter(letter: BillingLetter, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('billing_letters').upsert({
        id: letter.id,
        organization_id: orgId,
        letter_number: letter.letterNumber,
        letter_type: letter.letterType,
        invoice_id: letter.invoiceId,
        customer_id: letter.customerId,
        letter_date: letter.letterDate,
        invoice_due_date: letter.invoiceDueDate,
        overdue_days: letter.overdueDays,
        total_invoice_amount: letter.totalInvoiceAmount,
        paid_amount: letter.paidAmount,
        outstanding_amount: letter.outstandingAmount,
        extended_due_date: letter.extendedDueDate,
        subject: letter.subject,
        body_text: letter.bodyText,
        status: letter.status,
        sent_at: letter.sentAt,
      });

      return !error;
    } catch (e) {
      console.error('Supabase saveBillingLetter error:', e);
      return false;
    }
  }

  public static async deleteBillingLetter(letterId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('billing_letters').delete().eq('id', letterId);
      return !error;
    } catch (e) {
      console.error('Supabase deleteBillingLetter error:', e);
      return false;
    }
  }

  // =========================================================================
  // 7. DOCUMENTS ARCHIVE
  // =========================================================================

  public static async fetchDocuments(orgId: string): Promise<DocumentItem[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          customers ( name )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        documentType: d.document_type,
        documentNumber: d.document_number,
        customerId: d.customer_id,
        customerName: d.customers?.name || d.customer_name || '',
        referenceId: d.reference_id,
        amount: Number(d.amount) || 0,
        date: d.date,
        status: d.status,
        parentDocumentId: d.parent_document_id || undefined,
        createdAt: d.created_at,
      }));
    } catch (e) {
      console.error('Supabase fetchDocuments error:', e);
      return [];
    }
  }

  public static async saveDocument(doc: DocumentItem, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('documents').upsert({
        id: doc.id,
        organization_id: orgId,
        title: doc.title,
        document_type: doc.documentType,
        document_number: doc.documentNumber,
        customer_id: doc.customerId,
        reference_id: doc.referenceId,
        amount: doc.amount,
        date: doc.date,
        status: doc.status,
        parent_document_id: doc.parentDocumentId || null,
      });

      return !error;
    } catch (e) {
      console.error('Supabase saveDocument error:', e);
      return false;
    }
  }

  // =========================================================================
  // 7B. BUSINESS TRANSACTION DOCUMENTS
  // =========================================================================
  public static async saveBusinessDocument(doc: BusinessDocument, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('business_documents').upsert({
        id: doc.id, organization_id: orgId, document_type: doc.documentType, document_number: doc.documentNumber,
        title: doc.title, customer_id: doc.customerId || null, customer_name: doc.customerName || null, date: doc.date,
        valid_until: doc.validUntil || null, reference_number: doc.referenceNumber || null, parent_document_id: doc.parentDocumentId || null,
        delivery_address: doc.deliveryAddress || null, notes: doc.notes || null, status: doc.status,
        items: JSON.parse(JSON.stringify(doc.items)), subtotal: doc.subtotal, tax_amount: doc.taxAmount, grand_total: doc.grandTotal, updated_at: doc.updatedAt,
      });
      if (error) console.error('Supabase saveBusinessDocument error:', error);
      return !error;
    } catch (e) { console.error('Supabase saveBusinessDocument error:', e); return false; }
  }

  public static async fetchBusinessDocuments(orgId: string): Promise<BusinessDocument[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('business_documents').select('*').eq('organization_id', orgId).order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id, documentType: row.document_type, documentNumber: row.document_number, title: row.title,
        customerId: row.customer_id || undefined, customerName: row.customer_name || undefined, date: row.date,
        validUntil: row.valid_until || undefined, referenceNumber: row.reference_number || undefined, parentDocumentId: row.parent_document_id || undefined,
        deliveryAddress: row.delivery_address || undefined, notes: row.notes || undefined, status: row.status,
        items: Array.isArray(row.items) ? row.items : [], subtotal: Number(row.subtotal) || 0, taxAmount: Number(row.tax_amount) || 0,
        grandTotal: Number(row.grand_total) || 0, createdAt: row.created_at, updatedAt: row.updated_at,
      }));
    } catch (e) { console.error('Supabase fetchBusinessDocuments error:', e); return []; }
  }

  // =========================================================================
  // 8. AUDIT LOGS
  // =========================================================================

  public static async fetchAuditLogs(orgId: string): Promise<AuditLog[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (error) throw error;

      return (data || []).map((a) => ({
        id: a.id,
        userId: a.user_id || 'usr-system',
        userName: a.user_name,
        userRole: (a.user_role as UserRole) || 'finance',
        action: a.action as AuditLog['action'],
        module: a.module as AuditLog['module'],
        recordId: a.record_id,
        recordTitle: a.record_title,
        details: a.details,
        timestamp: a.timestamp,
      }));
    } catch (e) {
      console.error('Supabase fetchAuditLogs error:', e);
      return [];
    }
  }

  public static async saveAuditLog(log: AuditLog, orgId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('audit_logs').insert({
        id: log.id,
        organization_id: orgId,
        user_name: log.userName,
        user_role: log.userRole,
        action: log.action,
        module: log.module,
        record_id: log.recordId,
        record_title: log.recordTitle,
        details: log.details,
        timestamp: log.timestamp || new Date().toISOString(),
      });

      return !error;
    } catch (e) {
      console.error('Supabase saveAuditLog error:', e);
      return false;
    }
  }

  // =========================================================================
  // 9. FULL LOCALSTORAGE TO SUPABASE MIGRATION ENGINE
  // =========================================================================

  private static async resolveAuthenticatedOrganizationId(): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.organization_id || null;
    } catch (e) {
      console.error('Supabase resolveAuthenticatedOrganizationId error:', e);
      return null;
    }
  }

  public static async migrateLocalStorageToSupabase(
    localData: {
      organization: Organization;
      customers: Customer[];
      products: Product[];
      invoices: Invoice[];
      payments: Payment[];
      billingLetters: BillingLetter[];
      documents: DocumentItem[];
      auditLogs: AuditLog[];
      bankTransactions?: BankTransaction[];
    }
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      message: '',
      counts: {
        organizations: 0,
        customers: 0,
        products: 0,
        invoices: 0,
        invoiceItems: 0,
        payments: 0,
        billingLetters: 0,
        documents: 0,
        auditLogs: 0,
        bankTransactions: 0,
      },
      errors: [],
    };

    if (!isSupabaseConfigured) {
      result.errors.push('Supabase belum terhubung (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY kosong)');
      result.message = 'Gagal: Kredensial Supabase belum terpasang.';
      return result;
    }

    try {
      const localOrgId = localData.organization.id;
      const authenticatedOrgId = await this.resolveAuthenticatedOrganizationId();
      const orgId = authenticatedOrgId || (localOrgId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(localOrgId) ? localOrgId : null);

      if (!orgId) {
        result.errors.push('Organization ID cloud tidak ditemukan. Pastikan akun Supabase sudah login dan memiliki profile organisasi.');
        result.message = 'Migrasi dihentikan: organisasi cloud belum teridentifikasi.';
        return result;
      }

      // 1. Migrate Organization. Never send the legacy local org id to a UUID column.
      try {
        const orgSaved = await this.saveOrganization({ ...localData.organization, id: orgId });
        if (orgSaved) result.counts.organizations = 1;
        else result.errors.push('Org Error: Supabase menolak penyimpanan organisasi.');
      } catch (e: any) {
        result.errors.push(`Org Error: ${e.message}`);
      }

      // 2. Migrate Customers
      if (localData.customers.length > 0) {
        for (const cust of localData.customers) {
          const ok = await this.saveCustomer(cust, orgId);
          if (ok) result.counts.customers++;
          else result.errors.push(`Customer Error: ${cust.id} gagal disimpan (${cust.name}).`);
        }
      }

      // 3. Migrate Products
      if (localData.products.length > 0) {
        for (const prod of localData.products) {
          const ok = await this.saveProduct(prod, orgId);
          if (ok) result.counts.products++;
          else result.errors.push(`Product Error: ${prod.id} gagal disimpan (${prod.name}).`);
        }
      }

      // 4. Migrate Invoices & Line Items
      if (localData.invoices.length > 0) {
        for (const inv of localData.invoices) {
          const ok = await this.saveInvoice(inv, orgId);
          if (ok) {
            result.counts.invoices++;
            result.counts.invoiceItems += inv.items?.length || 0;
          } else {
            result.errors.push(`Invoice Error: ${inv.id} gagal disimpan (${inv.invoiceNumber}).`);
          }
        }
      }

      // 5. Migrate Payments
      if (localData.payments.length > 0) {
        for (const pay of localData.payments) {
          const ok = await this.savePayment(pay, orgId);
          if (ok) result.counts.payments++;
          else result.errors.push(`Payment Error: ${pay.id} gagal disimpan (${pay.paymentNumber}).`);
        }
      }

      // 6. Migrate Billing Letters
      if (localData.billingLetters.length > 0) {
        for (const letter of localData.billingLetters) {
          const ok = await this.saveBillingLetter(letter, orgId);
          if (ok) result.counts.billingLetters++;
          else result.errors.push(`Billing Letter Error: ${letter.id} gagal disimpan (${letter.letterNumber}).`);
        }
      }

      // 7. Migrate Documents
      if (localData.documents.length > 0) {
        for (const doc of localData.documents) {
          const ok = await this.saveDocument(doc, orgId);
          if (ok) result.counts.documents++;
          else result.errors.push(`Document Error: ${doc.id} gagal disimpan (${doc.documentNumber}).`);
        }
      }

      // 8. Migrate Audit Logs
      if (localData.auditLogs.length > 0) {
        for (const log of localData.auditLogs) {
          const ok = await this.saveAuditLog(log, orgId);
          if (ok) result.counts.auditLogs++;
          else result.errors.push(`Audit Error: ${log.id} gagal disimpan.`);
        }
      }

      result.success = result.errors.length === 0;
      result.message = result.success
        ? `Migrasi berhasil! ${result.counts.invoices} Faktur, ${result.counts.customers} Pelanggan, ${result.counts.products} Produk, ${result.counts.payments} Pembayaran berhasil disinkronkan ke Supabase Cloud.`
        : `Migrasi selesai dengan ${result.errors.length} masalah. Periksa daftar error sebelum menganggap data sudah tersinkron penuh.`;
      return result;
    } catch (err: any) {
      result.success = false;
      result.errors.push(err.message || 'Unknown migration exception');
      result.message = `Migrasi gagal: ${err.message}`;
      return result;
    }
  }
}

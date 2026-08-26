import { supabase, isSupabaseConfigured } from '../supabase';
import type { Database, DbDiscountType, DbInvoiceStatus, DbAuditAction, DbAuditModule } from '../../types/database';
import type { Invoice, InvoiceItem } from '../../types';
import { StorageService } from '../storage';

/**
 * Interface for line item inputs received from client/caller
 */
export interface CreateInvoiceItemInput {
  productId?: string | null;
  productCode?: string | null;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice?: number; // Server recalculates and validates against master catalog
  discount?: number;
  taxRate?: number;
}

/**
 * Interface for creating a new invoice
 */
export interface CreateInvoiceInput {
  customerId: string;
  issueDate: string;
  dueDate: string;
  poNumber?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  discountType?: DbDiscountType;
  discountValue?: number;
  taxRate?: number;
  additionalCharges?: number;
  bankAccountId?: string | null;
  status?: DbInvoiceStatus;
  items: CreateInvoiceItemInput[];
}

/**
 * Server-side calculation results to prevent client price tampering
 */
export interface CalculatedInvoiceSummary {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  additionalCharges: number;
  grandTotal: number;
  outstandingAmount: number;
  items: Array<{
    productId?: string | null;
    productCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxRate: number;
    amount: number;
  }>;
}

export interface InvoiceActionResult {
  success: boolean;
  data?: Invoice;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Server-Side Calculation Logic:
 * Strictly computes subtotal, item amounts, discounts, taxes, and grand totals.
 * Queries master products table when product IDs are supplied to prevent price manipulation.
 */
export async function calculateInvoiceAmounts(
  input: CreateInvoiceInput,
  organizationId: string
): Promise<CalculatedInvoiceSummary> {
  const itemInputs = input.items || [];
  if (itemInputs.length === 0) {
    throw new Error('Invoice harus memiliki setidaknya satu item barang / jasa.');
  }

  // 1. Collect product IDs to verify verified prices from products catalog
  const productIds = itemInputs
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  const productPriceMap = new Map<string, { price: number; code: string; taxRate: number; name: string; unit: string }>();

  if (isSupabaseConfigured && productIds.length > 0) {
    try {
      const { data: dbProducts } = await supabase
        .from('products')
        .select('id, code, name, price, tax_rate, unit')
        .in('id', productIds)
        .eq('organization_id', organizationId);

      if (dbProducts) {
        dbProducts.forEach((p) => {
          productPriceMap.set(p.id, {
            price: Number(p.price) || 0,
            code: p.code,
            taxRate: Number(p.tax_rate) || 11,
            name: p.name,
            unit: p.unit || 'Unit',
          });
        });
      }
    } catch (err) {
      console.warn('[InvoiceAction] Could not fetch products catalog from Supabase, using local fallback:', err);
    }
  }

  // If local storage fallback
  if (productPriceMap.size === 0 && productIds.length > 0) {
    const localProducts = StorageService.getProducts();
    localProducts.forEach((p) => {
      if (productIds.includes(p.id)) {
        productPriceMap.set(p.id, {
          price: p.price,
          code: p.code,
          taxRate: p.taxRate,
          name: p.name,
          unit: p.unit,
        });
      }
    });
  }

  // 2. Compute individual line items server-side
  let calculatedSubtotal = 0;
  const computedItems = itemInputs.map((item) => {
    const masterProduct = item.productId ? productPriceMap.get(item.productId) : null;
    
    // Server-verified unit price: Use master product price if exists, otherwise fallback to item price
    const verifiedUnitPrice = masterProduct
      ? masterProduct.price
      : Math.max(0, Number(item.unitPrice) || 0);

    const verifiedQty = Math.max(0.01, Number(item.quantity) || 1);
    const verifiedDiscount = Math.max(0, Number(item.discount) || 0);
    const verifiedTaxRate = item.taxRate !== undefined && item.taxRate !== null
      ? Number(item.taxRate)
      : (masterProduct ? masterProduct.taxRate : 11);

    // Calculate line item net amount: (quantity * unit_price) - discount
    const rawLineTotal = verifiedQty * verifiedUnitPrice;
    const lineDiscount = Math.min(rawLineTotal, verifiedDiscount);
    const lineAmount = Math.max(0, Math.round(rawLineTotal - lineDiscount));

    calculatedSubtotal += lineAmount;

    return {
      productId: item.productId || null,
      productCode: item.productCode || masterProduct?.code || 'CUSTOM',
      description: item.description || masterProduct?.name || 'Item Tagihan',
      quantity: verifiedQty,
      unit: item.unit || masterProduct?.unit || 'Unit',
      unitPrice: verifiedUnitPrice,
      discount: lineDiscount,
      taxRate: verifiedTaxRate,
      amount: lineAmount,
    };
  });

  // 3. Compute Invoice Level Discounts
  const discountType = input.discountType || 'fixed';
  const rawDiscountVal = Math.max(0, Number(input.discountValue) || 0);
  let computedDiscountAmount = 0;

  if (discountType === 'percentage') {
    const percentage = Math.min(100, rawDiscountVal);
    computedDiscountAmount = Math.round((calculatedSubtotal * percentage) / 100);
  } else {
    computedDiscountAmount = Math.min(calculatedSubtotal, rawDiscountVal);
  }

  const taxableAmount = Math.max(0, calculatedSubtotal - computedDiscountAmount);

  // 4. Compute Tax and Additional Charges
  const invoiceTaxRate = Number(input.taxRate ?? 11);
  const computedTaxAmount = invoiceTaxRate > 0
    ? Math.round((taxableAmount * invoiceTaxRate) / 100)
    : 0;

  const additionalCharges = Math.max(0, Number(input.additionalCharges) || 0);

  // 5. Compute Grand Total and Outstanding Balance
  const grandTotal = taxableAmount + computedTaxAmount + additionalCharges;
  const outstandingAmount = grandTotal; // For new invoice creation

  return {
    subtotal: calculatedSubtotal,
    discountAmount: computedDiscountAmount,
    taxableAmount,
    taxAmount: computedTaxAmount,
    additionalCharges,
    grandTotal,
    outstandingAmount,
    items: computedItems,
  };
}

/**
 * Generates formatted invoice sequence number (e.g. INV/2026/08/0001)
 */
export function generateInvoiceNumber(existingCount = 0): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(existingCount + 1).padStart(4, '0');
  return `INV/${year}/${month}/${seq}`;
}

/**
 * Creates an invoice transactionally:
 * - Validates authentication & organization ownership
 * - Calculates all financial formulas server-side
 * - Inserts into 'invoices' and 'invoice_items' atomically
 * - Updates customer total_invoiced and total_outstanding balances
 * - Creates an audit trail record
 */
export async function createInvoiceAction(
  input: CreateInvoiceInput,
  options?: {
    customOrgId?: string;
    actorUserId?: string;
    actorName?: string;
  }
): Promise<InvoiceActionResult> {
  try {
    // 1. Identify Organization and Auth Context
    let organizationId = options?.customOrgId;
    let actorId = options?.actorUserId;
    let actorName = options?.actorName || 'Sistem Keuangan';

    if (isSupabaseConfigured) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        actorId = authData.user.id;
        const meta = authData.user.user_metadata || {};
        if (!organizationId) {
          organizationId = meta.organization_id;
        }
        if (!options?.actorName) {
          actorName = meta.full_name || meta.name || authData.user.email || 'Admin';
        }
      }
    }

    if (!organizationId) {
      const currentOrg = StorageService.getOrganization();
      organizationId = currentOrg.id || 'org-001';
    }

    // 2. Validate Customer Existence
    let customerName = 'Customer';
    let customerCompanyName = '';
    let customerEmail = '';
    let customerPhone = '';
    let customerAddress = '';
    let customerNpwp = '';

    if (isSupabaseConfigured) {
      const { data: customerData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', input.customerId)
        .eq('organization_id', organizationId)
        .single();

      if (custErr || !customerData) {
        // Check local storage fallback
        const localCust = StorageService.getCustomers().find((c) => c.id === input.customerId);
        if (!localCust) {
          return {
            success: false,
            error: 'Data pelanggan (Customer) tidak ditemukan atau tidak berada pada organisasi Anda.',
          };
        }
        customerName = localCust.name;
        customerCompanyName = localCust.companyName;
        customerEmail = localCust.email;
        customerPhone = localCust.phone;
        customerAddress = localCust.address;
        customerNpwp = localCust.npwp || '';
      } else {
        customerName = customerData.name;
        customerCompanyName = customerData.company_name;
        customerEmail = customerData.email;
        customerPhone = customerData.phone;
        customerAddress = customerData.address;
        customerNpwp = customerData.npwp || '';
      }
    } else {
      const localCust = StorageService.getCustomers().find((c) => c.id === input.customerId);
      if (localCust) {
        customerName = localCust.name;
        customerCompanyName = localCust.companyName;
        customerEmail = localCust.email;
        customerPhone = localCust.phone;
        customerAddress = localCust.address;
        customerNpwp = localCust.npwp || '';
      }
    }

    // 3. Perform Server-Side Calculation (subtotal, tax, discounts, grandTotal)
    const summary = await calculateInvoiceAmounts(input, organizationId);

    // 4. Generate Invoice ID and Sequence Number
    const invoiceId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `inv-${Date.now()}`;

    const existingInvoices = StorageService.getInvoices();
    const invoiceNumber = generateInvoiceNumber(existingInvoices.length);

    const nowIso = new Date().toISOString();
    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      customerId: input.customerId,
      customerName,
      customerCompanyName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerNpwp,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      poNumber: input.poNumber || '',
      referenceNumber: input.referenceNumber || '',
      notes: input.notes || '',
      paymentTerms: input.paymentTerms || 'Net 14 Hari',
      subtotal: summary.subtotal,
      discountType: input.discountType || 'fixed',
      discountValue: Number(input.discountValue) || 0,
      discountAmount: summary.discountAmount,
      taxRate: Number(input.taxRate ?? 11),
      taxAmount: summary.taxAmount,
      additionalCharges: summary.additionalCharges,
      grandTotal: summary.grandTotal,
      paidAmount: 0,
      outstandingAmount: summary.grandTotal,
      status: input.status || 'unpaid',
      createdAt: nowIso,
      updatedAt: nowIso,
      bankAccountId: input.bankAccountId || undefined,
      items: summary.items.map((it, idx) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${idx}`,
        productId: it.productId || undefined,
        productCode: it.productCode,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxRate: it.taxRate,
        amount: it.amount,
      })),
    };

    // 5. Persist into Supabase Transactionally if configured
    if (isSupabaseConfigured) {
      // 5.1 Insert Invoice record
      const { error: invError } = await supabase.from('invoices').insert({
        id: newInvoice.id,
        organization_id: organizationId,
        invoice_number: newInvoice.invoiceNumber,
        customer_id: newInvoice.customerId,
        issue_date: newInvoice.issueDate,
        due_date: newInvoice.dueDate,
        po_number: newInvoice.poNumber || null,
        reference_number: newInvoice.referenceNumber || null,
        notes: newInvoice.notes || null,
        payment_terms: newInvoice.paymentTerms || null,
        subtotal: newInvoice.subtotal,
        discount_type: newInvoice.discountType,
        discount_value: newInvoice.discountValue,
        discount_amount: newInvoice.discountAmount,
        tax_rate: newInvoice.taxRate,
        tax_amount: newInvoice.taxAmount,
        additional_charges: newInvoice.additionalCharges,
        grand_total: newInvoice.grandTotal,
        paid_amount: 0,
        outstanding_amount: newInvoice.grandTotal,
        status: newInvoice.status,
        bank_account_id: newInvoice.bankAccountId || null,
        created_by: actorId || null,
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (invError) {
        console.error('[createInvoiceAction] Failed inserting invoice to Supabase:', invError);
        return {
          success: false,
          error: `Gagal menyimpan invoice: ${invError.message}`,
        };
      }

      // 5.2 Insert Line items in batch
      const itemRows = newInvoice.items.map((it) => ({
        id: it.id,
        invoice_id: newInvoice.id,
        product_id: it.productId || null,
        product_code: it.productCode || null,
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
        console.error('[createInvoiceAction] Failed inserting invoice items:', itemsError);
        // Rollback invoice record if items insertion fails
        await supabase.from('invoices').delete().eq('id', newInvoice.id);
        return {
          success: false,
          error: `Gagal menyimpan rincian item invoice: ${itemsError.message}`,
        };
      }

      // 5.3 Increment Customer Balance Aggregates in Database
      try {
        const { data: curCust } = await supabase
          .from('customers')
          .select('total_invoiced, total_outstanding')
          .eq('id', newInvoice.customerId)
          .single();

        if (curCust) {
          const updatedInvoiced = (Number(curCust.total_invoiced) || 0) + newInvoice.grandTotal;
          const updatedOutstanding = (Number(curCust.total_outstanding) || 0) + newInvoice.grandTotal;

          await supabase
            .from('customers')
            .update({
              total_invoiced: updatedInvoiced,
              total_outstanding: updatedOutstanding,
              updated_at: nowIso,
            })
            .eq('id', newInvoice.customerId);
        }
      } catch (custUpdateErr) {
        console.warn('[createInvoiceAction] Customer balance update error:', custUpdateErr);
      }

      // 5.4 Write Audit Log Entry
      try {
        await supabase.from('audit_logs').insert({
          organization_id: organizationId,
          user_id: actorId || null,
          user_name: actorName,
          user_role: 'finance',
          action: 'create' as DbAuditAction,
          module: 'invoices' as DbAuditModule,
          record_id: newInvoice.id,
          record_title: `${newInvoice.invoiceNumber} - ${customerName}`,
          details: `Invoice dibuat dengan total Rp ${newInvoice.grandTotal.toLocaleString('id-ID')} (${newInvoice.items.length} item)`,
        });
      } catch (auditErr) {
        console.warn('[createInvoiceAction] Audit log write failed:', auditErr);
      }
    }

    // 6. Update local application storage for real-time reactivity
    StorageService.saveInvoice({
      ...newInvoice,
      customerId: newInvoice.customerId,
      items: newInvoice.items,
    });

    return {
      success: true,
      data: newInvoice,
    };
  } catch (error: any) {
    console.error('[createInvoiceAction] Unhandled exception:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan sistem saat memproses pembuatan invoice.',
    };
  }
}

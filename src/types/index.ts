export type UserRole = 'owner' | 'admin' | 'finance' | 'staff' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isDefault: boolean;
}

export interface Organization {
  id: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  npwp: string;
  website: string;
  bankAccounts: BankAccount[];
  signatureName: string;
  signatureRole: string;
  signatureImage?: string;
  directorName?: string;
  defaultTaxRate: number; // e.g., 11 for 11% PPN
  defaultCurrency: string;
  timezone: string;
  invoiceFormat: string; // e.g. "INV/{YEAR}/{MONTH}/{NUMBER}"
  billingLetterFormat: string; // e.g. "ST/{YEAR}/{MONTH}/{NUMBER}"
  paymentReceiptFormat: string; // e.g. "KWT/{YEAR}/{MONTH}/{NUMBER}"
  invoicePrefix?: string;
  billingLetterPrefix?: string;
  receiptPrefix?: string;
  defaultPaymentTermsDays: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  companyName: string;
  npwp?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  pic: string;
  picPhone?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  unit: string; // e.g. "Bulan", "Jam", "Unit", "Paket", "Pcs"
  price: number;
  taxRate: number;
  isActive: boolean;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceItem {
  id: string;
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number; // percentage or fixed
  taxRate: number; // percentage e.g. 11
  amount: number; // calculated subtotal for this item
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerCompanyName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerNpwp?: string;
  customerPic?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  poNumber?: string;
  referenceNumber?: string;
  notes?: string;
  paymentTerms?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxableAmount?: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  additionalCharges: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  bankAccountId?: string;
}

export type PaymentMethod =
  | 'bank_transfer'
  | 'cash'
  | 'qris'
  | 'virtual_account'
  | 'giro_cek'
  | 'e_wallet'
  | 'other';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  destinationBank: string;
  bankAccountId?: string;
  accountNumber?: string;
  referenceNumber?: string;
  notes?: string;
  receivedBy: string;
  recordedBy?: string;
  receiptNumber: string;
  createdAt: string;
}

export type BillingLetterType =
  | 'sp1'
  | 'sp2'
  | 'sp3'
  | 'somasi'
  | 'pemberitahuan'
  | 'first_reminder'
  | 'second_warning'
  | 'final_demand';

export interface BillingLetter {
  id: string;
  letterNumber: string;
  letterType: BillingLetterType;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerCompanyName: string;
  customerAddress: string;
  customerPic?: string;
  letterDate: string;
  issueDate?: string;
  dueDate?: string;
  invoiceDueDate: string;
  overdueDays: number;
  totalInvoiceAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  penaltiesAmount: number;
  paymentDeadline: string;
  extendedDueDate: string;
  subject: string;
  bodyText: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  sentAt?: string;
}

export type DocumentType =
  | 'invoice'
  | 'billing_letter'
  | 'payment_receipt'
  | 'purchase_order'
  | 'quotation'
  | 'other';

export interface DocumentItem {
  id: string;
  title: string;
  documentType: DocumentType;
  documentNumber: string;
  customerId?: string;
  customerName?: string;
  referenceId?: string; // e.g. invoice id
  amount?: number;
  date: string;
  status: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'send' | 'pay' | 'cancel' | 'status_change' | 'reconcile';
  module: 'invoices' | 'payments' | 'customers' | 'billing_letters' | 'products' | 'settings' | 'auth' | 'reconciliation';
  recordId: string;
  recordTitle: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  details: string;
  timestamp: string;
}

export type BankTransactionType = 'CR' | 'DB';
export type BankReconciliationStatus = 'unmatched' | 'matched' | 'reconciled' | 'ignored';

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  transactionDate: string; // YYYY-MM-DD
  valueDate?: string;
  description: string;
  amount: number;
  type: BankTransactionType;
  referenceNumber: string;
  status: BankReconciliationStatus;
  matchedPaymentId?: string;
  matchedInvoiceId?: string;
  matchedInvoiceNumber?: string;
  matchedCustomerName?: string;
  matchConfidence?: number; // 0 to 100
  matchReason?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  notes?: string;
  rawPayload?: Record<string, any>;
}

export interface BankFeedConnection {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSyncedAt: string;
  totalTransactionsCount: number;
  feedType: 'api_direct' | 'csv_statement' | 'virtual_account' | 'qris_gateway';
}

export interface ReconciliationSummary {
  totalFeedTransactions: number;
  totalInflowAmount: number;
  totalOutflowAmount: number;
  reconciledCount: number;
  reconciledAmount: number;
  matchedReadyCount: number;
  matchedReadyAmount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  ignoredCount: number;
  matchPercentage: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  linkModule?: string;
  linkId?: string;
}

export interface DashboardStats {
  totalInvoicesCount: number;
  totalInvoicedAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
  overdueCount: number;
  overdueAmount: number;
  totalOutstandingReceivables: number;
  monthPaymentsAmount: number;
  monthPaymentsCount: number;
  monthRevenueAmount: number;
  paidInvoicesCount: number;
}

export interface AgingReceivableGroup {
  range: string;
  amount: number;
  count: number;
  percentage: number;
}

// Re-export PostgreSQL Supabase Multi-Tenant Database Schema Types
export * from './database';

import {
  Organization,
  UserProfile,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  Payment,
  BillingLetter,
  DocumentItem,
  BusinessDocument,
  AuditLog,
  NotificationItem,
  DashboardStats,
  AgingReceivableGroup,
  BankTransaction,
  BankFeedConnection,
  ReconciliationSummary,
} from '../types';
import { formatDocNumber, getDaysOverdue } from './utils';
import { SupabaseService } from './supabaseService';

/**
 * Generates a real UUID (v4) for any entity that will be persisted to Supabase.
 *
 * IMPORTANT: every Postgres table in this project uses `id UUID PRIMARY KEY`.
 * Previously this file generated ids like `prod-${Date.now()}`, which are NOT
 * valid UUIDs. Postgres rejects those with an "invalid input syntax for type
 * uuid" error on upsert - and because every sync call is wrapped in a
 * try/catch that only does `console.error(...)`, every single one of those
 * writes was failing silently. The app *looked* like it was syncing (no
 * visible error, local cache updated fine) while nothing ever reached the
 * database. Always use this helper for new entity ids going forward.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator for environments without crypto.randomUUID
  // (older browsers / non-secure contexts).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

const STORAGE_KEYS = {
  ORGANIZATION: 'billingflow_organization',
  USER: 'billingflow_user',
  CUSTOMERS: 'billingflow_customers',
  PRODUCTS: 'billingflow_products',
  INVENTORY_MOVEMENTS: 'billingflow_inventory_movements',
  VENDORS: 'billingflow_vendors',
  PURCHASES: 'billingflow_purchases',
  INVOICES: 'billingflow_invoices',
  PAYMENTS: 'billingflow_payments',
  BILLING_LETTERS: 'billingflow_billing_letters',
  DOCUMENTS: 'billingflow_documents',
  BUSINESS_DOCUMENTS: 'billingflow_business_documents',
  AUDIT_LOGS: 'billingflow_audit_logs',
  NOTIFICATIONS: 'billingflow_notifications',
  SEQUENCES: 'billingflow_sequences',
  BANK_TRANSACTIONS: 'billingflow_bank_transactions',
  BANK_CONNECTIONS: 'billingflow_bank_connections',
};

// Default organization
export const initialOrganization: Organization = {
  id: '00000000-0000-4000-8000-000000000001',
  organizationType: 'pt',
  name: 'PT BillingFlow Solusi Finansial',
  tagline: 'Sistem Penagihan & Manajemen Keuangan Terpadu',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  email: 'finance@billingflow.id',
  phone: '+62 21 5589 8899',
  address: 'Jl. Jenderal Sudirman Kav. 52-53, Menara Sentral Lt. 18',
  city: 'Jakarta Selatan',
  province: 'DKI Jakarta',
  postalCode: '12190',
  npwp: '01.345.678.9-012.000',
  website: 'https://billingflow.id',
  bankAccounts: [
    {
      id: 'bank-001',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '8830 1928 33',
      accountHolder: 'PT BILLINGFLOW SOLUSI FINANSIAL',
      branch: 'KCU Sudirman',
      isDefault: true,
    },
    {
      id: 'bank-002',
      bankName: 'Bank Mandiri',
      accountNumber: '137 00 9823 4455',
      accountHolder: 'PT BILLINGFLOW SOLUSI FINANSIAL',
      branch: 'KC Thamrin',
      isDefault: false,
    },
  ],
  signatureName: 'Budi Hartono, SE, Ak., CA',
  signatureRole: 'Direktur Keuangan (CFO)',
  signatureImage: '',
  defaultTaxRate: 11, // PPN 11%
  defaultCurrency: 'IDR',
  timezone: 'Asia/Jakarta',
  invoiceFormat: 'INV/{YEAR}/{MONTH}/{NUMBER}',
  billingLetterFormat: 'ST/{YEAR}/{MONTH}/{NUMBER}',
  paymentReceiptFormat: 'KWT/{YEAR}/{MONTH}/{NUMBER}',
  defaultPaymentTermsDays: 14,
};

export const initialUser: UserProfile = {
  id: 'usr-001',
  name: 'Ahmad Fauzi, S.Kom',
  email: 'fauzi@billingflow.id',
  role: 'owner',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  organizationId: '00000000-0000-4000-8000-000000000001',
};

export const initialCustomers: Customer[] = [
  {
    id: 'cust-001',
    code: 'CUST-001',
    name: 'PT Telkom Prima Nusantara',
    companyName: 'PT Telkom Prima Nusantara',
    npwp: '02.456.789.1-015.000',
    email: 'procurement@telkomprima.co.id',
    phone: '+62 21 8060 1200',
    address: 'Gedung Grha Telekomunikasi Lt. 12, Jl. Gatot Subroto No. 45',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12950',
    pic: 'Ir. Hendra Gunawan',
    picPhone: '+62 811 2345 678',
    notes: 'Klien korporat platinum, termin pembayaran net 30 hari.',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    totalInvoiced: 125000000,
    totalPaid: 75000000,
    totalOutstanding: 50000000,
  },
  {
    id: 'cust-002',
    code: 'CUST-002',
    name: 'CV Nusantara Digital Kreasi',
    companyName: 'CV Nusantara Digital Kreasi',
    npwp: '03.789.123.4-022.000',
    email: 'finance@nusantaradigital.id',
    phone: '+62 22 7200 456',
    address: 'Jl. Riau No. 88, Citarum',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40115',
    pic: 'Siti Rahmawati',
    picPhone: '+62 812 9876 543',
    notes: 'Agensi digital, sering menggunakan layanan cloud tahunan.',
    isActive: true,
    createdAt: '2026-02-01T09:30:00.000Z',
    totalInvoiced: 45000000,
    totalPaid: 45000000,
    totalOutstanding: 0,
  },
  {
    id: 'cust-003',
    code: 'CUST-003',
    name: 'PT Global Solusi Mandiri',
    companyName: 'PT Global Solusi Mandiri',
    npwp: '01.999.888.7-033.000',
    email: 'billing@globalsolusi.co.id',
    phone: '+62 31 567 8901',
    address: 'Pakuwon Center Lt. 21, Jl. Embong Malang No. 1-5',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postalCode: '60261',
    pic: 'Doni Pratama, MBA',
    picPhone: '+62 813 4567 890',
    notes: 'Klien lama, membutuhkan faktur pajak tepat waktu.',
    isActive: true,
    createdAt: '2026-02-15T11:00:00.000Z',
    totalInvoiced: 82500000,
    totalPaid: 32500000,
    totalOutstanding: 50000000,
  },
  {
    id: 'cust-004',
    code: 'CUST-004',
    name: 'PT Makmur Jaya Logistik',
    companyName: 'PT Makmur Jaya Logistik',
    npwp: '04.111.222.3-044.000',
    email: 'accounting@makmurlogistik.com',
    phone: '+62 24 841 2345',
    address: 'Kawasan Industri Candi Blok A No. 12',
    city: 'Semarang',
    province: 'Jawa Tengah',
    postalCode: '50181',
    pic: 'Bambang Sudiro',
    picPhone: '+62 815 6789 012',
    notes: 'Kontrak maintenance software logistik.',
    isActive: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    totalInvoiced: 38000000,
    totalPaid: 18000000,
    totalOutstanding: 20000000,
  },
  {
    id: 'cust-005',
    code: 'CUST-005',
    name: 'Klinik Sehat Utama Medika',
    companyName: 'PT Sehat Utama Medika',
    npwp: '05.333.444.5-055.000',
    email: 'admin@sehatutama.id',
    phone: '+62 274 567 123',
    address: 'Jl. Kaliurang Km. 6 No. 20',
    city: 'Sleman',
    province: 'DI Yogyakarta',
    postalCode: '55281',
    pic: 'dr. Maya Kusuma',
    picPhone: '+62 817 8901 234',
    notes: 'Implementasi SIMKlinik Cloud.',
    isActive: true,
    createdAt: '2026-03-10T14:00:00.000Z',
    totalInvoiced: 22000000,
    totalPaid: 22000000,
    totalOutstanding: 0,
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-001',
    code: 'SRV-ERP-01',
    name: 'Implementasi & Kustomisasi ERP Enterprise',
    category: 'Jasa Profesional',
    description: 'Setup modul Keuangan, Penggajian, Inventaris, dan Integrasi API API Bank.',
    unit: 'Paket',
    price: 50000000,
    taxRate: 11,
    isActive: true,
  },
  {
    id: 'prod-002',
    code: 'SRV-MAINT-01',
    name: 'Jasa Pemeliharaan & Support SLA 24/7',
    category: 'Maintenance',
    description: 'Dukungan teknis, monitoring server, bug fix, dan patch keamanan bulanan.',
    unit: 'Bulan',
    price: 7500000,
    taxRate: 11,
    isActive: true,
  },
  {
    id: 'prod-003',
    code: 'LIC-CLOUD-PRO',
    name: 'Langganan BillingFlow Enterprise Cloud License',
    category: 'Lisensi Software',
    description: 'Lisensi SaaS hingga 50 pengguna, unlimited invoice & multi-tenant storage.',
    unit: 'Tahun',
    price: 24000000,
    taxRate: 11,
    isActive: true,
  },
  {
    id: 'prod-004',
    code: 'SRV-TRAIN-01',
    name: 'Pelatihan & Workshop Onsite Pengguna',
    category: 'Training',
    description: 'Sesi training 2 hari intensif untuk staf keuangan dan admin operasional.',
    unit: 'Sesi',
    price: 8000000,
    taxRate: 11,
    isActive: true,
  },
  {
    id: 'prod-005',
    code: 'SRV-AUDIT-01',
    name: 'Audit Keamanan & Kepatuhan Keuangan IT',
    category: 'Konsultasi',
    description: 'Pemeriksaan integritas data transaksi dan rekomendasi mitigasi risiko.',
    unit: 'Proyek',
    price: 15000000,
    taxRate: 11,
    isActive: true,
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV/2026/08/00001',
    customerId: 'cust-001',
    customerName: 'PT Telkom Prima Nusantara',
    customerCompanyName: 'PT Telkom Prima Nusantara',
    customerEmail: 'procurement@telkomprima.co.id',
    customerPhone: '+62 21 8060 1200',
    customerAddress: 'Gedung Grha Telekomunikasi Lt. 12, Jl. Gatot Subroto No. 45, Jakarta Selatan',
    customerNpwp: '02.456.789.1-015.000',
    issueDate: '2026-07-15',
    dueDate: '2026-08-14', // Overdue relative to 2026-08-19
    poNumber: 'PO-TPN-2026-077',
    referenceNumber: 'REF/FIN/778',
    notes: 'Mohon cantumkan nomor invoice pada berita transfer bank.',
    paymentTerms: 'Net 30 Hari sejak invoice diterbitkan.',
    items: [
      {
        id: 'item-001',
        productId: 'prod-001',
        productCode: 'SRV-ERP-01',
        description: 'Implementasi & Kustomisasi ERP Enterprise - Tahap Final',
        quantity: 1,
        unit: 'Paket',
        unitPrice: 50000000,
        discount: 0,
        taxRate: 11,
        amount: 50000000,
      },
    ],
    subtotal: 50000000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 11,
    taxAmount: 5500000,
    additionalCharges: 0,
    grandTotal: 55500000,
    paidAmount: 0,
    outstandingAmount: 55500000,
    status: 'overdue',
    createdAt: '2026-07-15T09:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    sentAt: '2026-07-15T10:00:00.000Z',
    viewedAt: '2026-07-16T14:20:00.000Z',
    bankAccountId: 'bank-001',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV/2026/08/00002',
    customerId: 'cust-003',
    customerName: 'PT Global Solusi Mandiri',
    customerCompanyName: 'PT Global Solusi Mandiri',
    customerEmail: 'billing@globalsolusi.co.id',
    customerPhone: '+62 31 567 8901',
    customerAddress: 'Pakuwon Center Lt. 21, Jl. Embong Malang No. 1-5, Surabaya',
    customerNpwp: '01.999.888.7-033.000',
    issueDate: '2026-08-01',
    dueDate: '2026-08-25',
    poNumber: 'PO-GSM-8812',
    notes: 'Pembayaran termin pertama 50% telah diterima.',
    paymentTerms: 'Termin: 50% DP, 50% Pelunasan.',
    items: [
      {
        id: 'item-002',
        productId: 'prod-003',
        productCode: 'LIC-CLOUD-PRO',
        description: 'Langganan BillingFlow Enterprise Cloud License (2 Tahun)',
        quantity: 2,
        unit: 'Tahun',
        unitPrice: 24000000,
        discount: 3000000,
        taxRate: 11,
        amount: 45000000,
      },
    ],
    subtotal: 45000000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 11,
    taxAmount: 4950000,
    additionalCharges: 0,
    grandTotal: 49950000,
    paidAmount: 25000000,
    outstandingAmount: 24950000,
    status: 'partially_paid',
    createdAt: '2026-08-01T08:30:00.000Z',
    updatedAt: '2026-08-05T11:00:00.000Z',
    sentAt: '2026-08-01T09:15:00.000Z',
    viewedAt: '2026-08-02T10:00:00.000Z',
    bankAccountId: 'bank-001',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV/2026/08/00003',
    customerId: 'cust-002',
    customerName: 'CV Nusantara Digital Kreasi',
    customerCompanyName: 'CV Nusantara Digital Kreasi',
    customerEmail: 'finance@nusantaradigital.id',
    customerPhone: '+62 22 7200 456',
    customerAddress: 'Jl. Riau No. 88, Citarum, Bandung',
    customerNpwp: '03.789.123.4-022.000',
    issueDate: '2026-08-05',
    dueDate: '2026-08-19',
    poNumber: 'NDK-PO-2026-08',
    notes: 'Lunas via Transfer BCA.',
    paymentTerms: 'Net 14 Hari',
    items: [
      {
        id: 'item-003',
        productId: 'prod-002',
        productCode: 'SRV-MAINT-01',
        description: 'Jasa Pemeliharaan & Support SLA 24/7 (Kuartal 3)',
        quantity: 3,
        unit: 'Bulan',
        unitPrice: 7500000,
        discount: 0,
        taxRate: 11,
        amount: 22500000,
      },
    ],
    subtotal: 22500000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 11,
    taxAmount: 2475000,
    additionalCharges: 0,
    grandTotal: 24975000,
    paidAmount: 24975000,
    outstandingAmount: 0,
    status: 'paid',
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-08-10T14:30:00.000Z',
    sentAt: '2026-08-05T11:00:00.000Z',
    paidAt: '2026-08-10T14:30:00.000Z',
    bankAccountId: 'bank-001',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV/2026/08/00004',
    customerId: 'cust-004',
    customerName: 'PT Makmur Jaya Logistik',
    customerCompanyName: 'PT Makmur Jaya Logistik',
    customerEmail: 'accounting@makmurlogistik.com',
    customerPhone: '+62 24 841 2345',
    customerAddress: 'Kawasan Industri Candi Blok A No. 12, Semarang',
    customerNpwp: '04.111.222.3-044.000',
    issueDate: '2026-08-12',
    dueDate: '2026-08-26',
    poNumber: 'MJL/AUG/091',
    notes: 'Menunggu konfirmasi approval finance pusat.',
    paymentTerms: 'Net 14 Hari',
    items: [
      {
        id: 'item-004',
        productId: 'prod-004',
        productCode: 'SRV-TRAIN-01',
        description: 'Pelatihan & Workshop Onsite Pengguna Keuangan',
        quantity: 2,
        unit: 'Sesi',
        unitPrice: 8000000,
        discount: 0,
        taxRate: 11,
        amount: 16000000,
      },
    ],
    subtotal: 16000000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 11,
    taxAmount: 1760000,
    additionalCharges: 0,
    grandTotal: 17760000,
    paidAmount: 0,
    outstandingAmount: 17760000,
    status: 'sent',
    createdAt: '2026-08-12T13:00:00.000Z',
    updatedAt: '2026-08-12T13:00:00.000Z',
    sentAt: '2026-08-12T14:00:00.000Z',
    bankAccountId: 'bank-001',
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV/2026/08/00005',
    customerId: 'cust-005',
    customerName: 'Klinik Sehat Utama Medika',
    customerCompanyName: 'PT Sehat Utama Medika',
    customerEmail: 'admin@sehatutama.id',
    customerPhone: '+62 274 567 123',
    customerAddress: 'Jl. Kaliurang Km. 6 No. 20, Sleman, Yogyakarta',
    customerNpwp: '05.333.444.5-055.000',
    issueDate: '2026-08-18',
    dueDate: '2026-09-01',
    notes: 'Draft penawaran audit sistem klinik.',
    paymentTerms: 'Net 14 Hari',
    items: [
      {
        id: 'item-005',
        productId: 'prod-005',
        productCode: 'SRV-AUDIT-01',
        description: 'Audit Keamanan & Kepatuhan Keuangan IT SIMKlinik',
        quantity: 1,
        unit: 'Proyek',
        unitPrice: 15000000,
        discount: 0,
        taxRate: 11,
        amount: 15000000,
      },
    ],
    subtotal: 15000000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 11,
    taxAmount: 1650000,
    additionalCharges: 0,
    grandTotal: 16650000,
    paidAmount: 0,
    outstandingAmount: 16650000,
    status: 'draft',
    createdAt: '2026-08-18T16:00:00.000Z',
    updatedAt: '2026-08-18T16:00:00.000Z',
    bankAccountId: 'bank-001',
  },
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-001',
    paymentNumber: 'PAY/2026/08/00001',
    invoiceId: 'inv-002',
    invoiceNumber: 'INV/2026/08/00002',
    customerId: 'cust-003',
    customerName: 'PT Global Solusi Mandiri',
    paymentDate: '2026-08-05',
    amount: 25000000,
    paymentMethod: 'bank_transfer',
    destinationBank: 'Bank Central Asia (BCA) - 8830 1928 33',
    accountNumber: 'BCA-8830192833',
    referenceNumber: 'TRF-BCA-9812948',
    notes: 'Pembayaran DP 50% Kontrak Cloud Enterprise',
    receivedBy: 'Ahmad Fauzi (Owner)',
    receiptNumber: 'KWT/2026/08/00001',
    createdAt: '2026-08-05T11:00:00.000Z',
  },
  {
    id: 'pay-002',
    paymentNumber: 'PAY/2026/08/00002',
    invoiceId: 'inv-003',
    invoiceNumber: 'INV/2026/08/00003',
    customerId: 'cust-002',
    customerName: 'CV Nusantara Digital Kreasi',
    paymentDate: '2026-08-10',
    amount: 24975000,
    paymentMethod: 'bank_transfer',
    destinationBank: 'Bank Central Asia (BCA) - 8830 1928 33',
    accountNumber: 'BCA-8830192833',
    referenceNumber: 'TRF-BCA-1029384',
    notes: 'Pelunasan invoice maintenance Q3',
    receivedBy: 'Ahmad Fauzi (Owner)',
    receiptNumber: 'KWT/2026/08/00002',
    createdAt: '2026-08-10T14:30:00.000Z',
  },
];

export const initialBillingLetters: BillingLetter[] = [
  {
    id: 'bl-001',
    letterNumber: 'ST/2026/08/00001',
    letterType: 'first_reminder',
    invoiceId: 'inv-001',
    invoiceNumber: 'INV/2026/08/00001',
    customerId: 'cust-001',
    customerName: 'PT Telkom Prima Nusantara',
    customerCompanyName: 'PT Telkom Prima Nusantara',
    customerAddress: 'Gedung Grha Telekomunikasi Lt. 12, Jl. Gatot Subroto No. 45, Jakarta Selatan',
    letterDate: '2026-08-16',
    invoiceDueDate: '2026-08-14',
    overdueDays: 5,
    totalInvoiceAmount: 55500000,
    paidAmount: 0,
    outstandingAmount: 55500000,
    penaltiesAmount: 0,
    paymentDeadline: '2026-08-25',
    extendedDueDate: '2026-08-25',
    subject: 'Surat Pemberitahuan Jatuh Tempo & Permohonan Pembayaran Tagihan',
    bodyText:
      'Berdasarkan data keuangan kami, terdapat kewajiban pembayaran Invoice No. INV/2026/08/00001 sebesar Rp55.500.000 yang telah melewati batas tanggal jatuh tempo (14 Agustus 2026). Kami memohon kerja sama Bapak/Ibu untuk dapat melakukan pelunasan tagihan tersebut paling lambat tanggal 25 Agustus 2026.',
    status: 'sent',
    createdAt: '2026-08-16T10:00:00.000Z',
    sentAt: '2026-08-16T10:30:00.000Z',
  },
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-001',
    title: 'Faktur Penagihan - PT Telkom Prima Nusantara',
    documentType: 'invoice',
    documentNumber: 'INV/2026/08/00001',
    customerId: 'cust-001',
    customerName: 'PT Telkom Prima Nusantara',
    referenceId: 'inv-001',
    amount: 55500000,
    date: '2026-07-15',
    status: 'Jatuh Tempo',
    createdAt: '2026-07-15T09:00:00.000Z',
  },
  {
    id: 'doc-002',
    title: 'Faktur Penagihan - PT Global Solusi Mandiri',
    documentType: 'invoice',
    documentNumber: 'INV/2026/08/00002',
    customerId: 'cust-003',
    customerName: 'PT Global Solusi Mandiri',
    referenceId: 'inv-002',
    amount: 49950000,
    date: '2026-08-01',
    status: 'Dibayar Sebagian',
    createdAt: '2026-08-01T08:30:00.000Z',
  },
  {
    id: 'doc-003',
    title: 'Bukti Penerimaan Pembayaran DP - PT Global Solusi Mandiri',
    documentType: 'payment_receipt',
    documentNumber: 'KWT/2026/08/00001',
    customerId: 'cust-003',
    customerName: 'PT Global Solusi Mandiri',
    referenceId: 'pay-001',
    amount: 25000000,
    date: '2026-08-05',
    status: 'Terverifikasi',
    createdAt: '2026-08-05T11:00:00.000Z',
  },
  {
    id: 'doc-004',
    title: 'Surat Tagihan Pertama - PT Telkom Prima Nusantara',
    documentType: 'billing_letter',
    documentNumber: 'ST/2026/08/00001',
    customerId: 'cust-001',
    customerName: 'PT Telkom Prima Nusantara',
    referenceId: 'bl-001',
    amount: 55500000,
    date: '2026-08-16',
    status: 'Terkirim',
    createdAt: '2026-08-16T10:00:00.000Z',
  },
  {
    id: 'doc-005',
    title: 'Kuitansi Pelunasan - CV Nusantara Digital Kreasi',
    documentType: 'payment_receipt',
    documentNumber: 'KWT/2026/08/00002',
    customerId: 'cust-002',
    customerName: 'CV Nusantara Digital Kreasi',
    referenceId: 'pay-002',
    amount: 24975000,
    date: '2026-08-10',
    status: 'Lunas',
    createdAt: '2026-08-10T14:30:00.000Z',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    userId: 'usr-001',
    userName: 'Ahmad Fauzi',
    userRole: 'owner',
    action: 'create',
    module: 'invoices',
    recordId: 'inv-001',
    recordTitle: 'INV/2026/08/00001',
    details: 'Membuat invoice baru untuk PT Telkom Prima Nusantara senilai Rp55.500.000',
    timestamp: '2026-07-15T09:00:00.000Z',
  },
  {
    id: 'audit-002',
    userId: 'usr-001',
    userName: 'Ahmad Fauzi',
    userRole: 'owner',
    action: 'pay',
    module: 'payments',
    recordId: 'pay-001',
    recordTitle: 'PAY/2026/08/00001',
    details: 'Mencatat pembayaran DP Rp25.000.000 dari PT Global Solusi Mandiri untuk INV/2026/08/00002',
    timestamp: '2026-08-05T11:00:00.000Z',
  },
  {
    id: 'audit-003',
    userId: 'usr-001',
    userName: 'Ahmad Fauzi',
    userRole: 'owner',
    action: 'pay',
    module: 'payments',
    recordId: 'pay-002',
    recordTitle: 'PAY/2026/08/00002',
    details: 'Mencatat pelunasan Rp24.975.000 dari CV Nusantara Digital Kreasi untuk INV/2026/08/00003',
    timestamp: '2026-08-10T14:30:00.000Z',
  },
  {
    id: 'audit-004',
    userId: 'usr-001',
    userName: 'Ahmad Fauzi',
    userRole: 'owner',
    action: 'create',
    module: 'billing_letters',
    recordId: 'bl-001',
    recordTitle: 'ST/2026/08/00001',
    details: 'Menerbitkan Surat Tagihan Pertama untuk invoice jatuh tempo PT Telkom Prima Nusantara',
    timestamp: '2026-08-16T10:00:00.000Z',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-001',
    title: 'Invoice Jatuh Tempo',
    message: 'Invoice INV/2026/08/00001 untuk PT Telkom Prima Nusantara telah melewati tanggal jatuh tempo.',
    type: 'warning',
    isRead: false,
    createdAt: '2026-08-15T08:00:00.000Z',
    linkModule: 'invoices',
    linkId: 'inv-001',
  },
  {
    id: 'notif-002',
    title: 'Pembayaran Diterima',
    message: 'Pembayaran sebesar Rp24.975.000 telah diverifikasi untuk Invoice INV/2026/08/00003.',
    type: 'success',
    isRead: true,
    createdAt: '2026-08-10T14:30:00.000Z',
    linkModule: 'payments',
    linkId: 'pay-002',
  },
];

export const initialBankConnections: BankFeedConnection[] = [
  {
    id: 'conn-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    accountHolder: 'PT BILLINGFLOW SOLUSI FINANSIAL',
    status: 'connected',
    lastSyncedAt: '2026-08-21T07:15:00.000Z',
    totalTransactionsCount: 142,
    feedType: 'api_direct',
  },
  {
    id: 'conn-002',
    bankName: 'Bank Mandiri',
    accountNumber: '137 00 9823 4455',
    accountHolder: 'PT BILLINGFLOW SOLUSI FINANSIAL',
    status: 'connected',
    lastSyncedAt: '2026-08-21T06:30:00.000Z',
    totalTransactionsCount: 88,
    feedType: 'api_direct',
  },
  {
    id: 'conn-003',
    bankName: 'BCA Virtual Account Gateway',
    accountNumber: '8830 1928 XXXX',
    accountHolder: 'PT BILLINGFLOW SOLUSI FINANSIAL',
    status: 'connected',
    lastSyncedAt: '2026-08-21T07:20:00.000Z',
    totalTransactionsCount: 65,
    feedType: 'virtual_account',
  },
];

export const initialBankTransactions: BankTransaction[] = [
  {
    id: 'bt-001',
    bankAccountId: 'bank-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    transactionDate: '2026-08-14',
    valueDate: '2026-08-14',
    description: 'TRSF E-BANKING CR 2008/FBO/INV/2026/08/00004 PT MAKMUR JAYA LOGISTIK',
    amount: 17760000,
    type: 'CR',
    referenceNumber: 'BCA-TRSF-891023',
    status: 'matched',
    matchedInvoiceId: 'inv-004',
    matchedInvoiceNumber: 'INV/2026/08/00004',
    matchedCustomerName: 'PT Makmur Jaya Logistik',
    matchConfidence: 100,
    matchReason: 'Nomor invoice persis (INV/2026/08/00004) & nominal sesuai (Rp17.760.000)',
  },
  {
    id: 'bt-002',
    bankAccountId: 'bank-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    transactionDate: '2026-08-19',
    valueDate: '2026-08-19',
    description: 'PEMINDAHBUKUAN CR KLINIK SEHAT UTAMA INV 00005 DP MEDIKA',
    amount: 12000000,
    type: 'CR',
    referenceNumber: 'BCA-PBK-771239',
    status: 'matched',
    matchedInvoiceId: 'inv-005',
    matchedInvoiceNumber: 'INV/2026/08/00005',
    matchedCustomerName: 'Klinik Sehat Utama Medika',
    matchConfidence: 95,
    matchReason: 'Nama pelanggan (Klinik Sehat Utama) & referensi invoice INV/2026/08/00005',
  },
  {
    id: 'bt-003',
    bankAccountId: 'bank-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    transactionDate: '2026-08-10',
    valueDate: '2026-08-10',
    description: 'TRSF CR PELUNASAN NDK KREASI JASA MAINT SLA Q3',
    amount: 24975000,
    type: 'CR',
    referenceNumber: 'BCA-TRSF-554411',
    status: 'reconciled',
    matchedPaymentId: 'pay-002',
    matchedInvoiceId: 'inv-003',
    matchedInvoiceNumber: 'INV/2026/08/00003',
    matchedCustomerName: 'CV Nusantara Digital Kreasi',
    matchConfidence: 100,
    matchReason: 'Terverifikasi & cocok dengan Kuitansi KWT/2026/08/00002',
    reconciledAt: '2026-08-10T14:30:00.000Z',
    reconciledBy: 'Ahmad Fauzi',
  },
  {
    id: 'bt-004',
    bankAccountId: 'bank-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    transactionDate: '2026-08-05',
    valueDate: '2026-08-05',
    description: 'TRSF CR PT GLOBAL SOLUSI MANDIRI DP CLOUD ERP',
    amount: 25000000,
    type: 'CR',
    referenceNumber: 'BCA-TRSF-441100',
    status: 'reconciled',
    matchedPaymentId: 'pay-001',
    matchedInvoiceId: 'inv-002',
    matchedInvoiceNumber: 'INV/2026/08/00002',
    matchedCustomerName: 'PT Global Solusi Mandiri',
    matchConfidence: 100,
    matchReason: 'Terverifikasi & cocok dengan Kuitansi KWT/2026/08/00001',
    reconciledAt: '2026-08-05T11:00:00.000Z',
    reconciledBy: 'Ahmad Fauzi',
  },
  {
    id: 'bt-005',
    bankAccountId: 'bank-002',
    bankName: 'Bank Mandiri',
    accountNumber: '137 00 9823 4455',
    transactionDate: '2026-08-19',
    valueDate: '2026-08-19',
    description: 'TRSF MCM CR PT TELKOM PRIMA NUSANTARA CICILAN TMY',
    amount: 30000000,
    type: 'CR',
    referenceNumber: 'MDR-MCM-993214',
    status: 'matched',
    matchedInvoiceId: 'inv-001',
    matchedInvoiceNumber: 'INV/2026/08/00001',
    matchedCustomerName: 'PT Telkom Prima Nusantara',
    matchConfidence: 85,
    matchReason: 'Nama pelanggan (PT Telkom Prima Nusantara) untuk tagihan INV/2026/08/00001',
  },
  {
    id: 'bt-006',
    bankAccountId: 'bank-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    transactionDate: '2026-08-20',
    valueDate: '2026-08-20',
    description: 'QRIS SETTLEMENT BATCH 20260820-098 PT BANK CENTRAL ASIA',
    amount: 5450000,
    type: 'CR',
    referenceNumber: 'BCA-QRIS-0098',
    status: 'unmatched',
    matchConfidence: 35,
    matchReason: 'Penerimaan QRIS gabungan - perlu alokasi manual',
  },
  {
    id: 'bt-007',
    bankAccountId: 'bank-001',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830 1928 33',
    transactionDate: '2026-08-21',
    valueDate: '2026-08-21',
    description: 'BIAYA ADM REK GIRO & PAJAK BUNGA BCA KCU SUDIRMAN',
    amount: 25000,
    type: 'DB',
    referenceNumber: 'BCA-ADM-0821',
    status: 'ignored',
    matchConfidence: 0,
    matchReason: 'Biaya operasional bank / non-tagihan',
  },
  {
    id: 'bt-008',
    bankAccountId: 'bank-002',
    bankName: 'Bank Mandiri',
    accountNumber: '137 00 9823 4455',
    transactionDate: '2026-08-21',
    valueDate: '2026-08-21',
    description: 'TRSF CR CV NUSANTARA DIGITAL KREASI KONTRAK BARU DESIGN',
    amount: 15000000,
    type: 'CR',
    referenceNumber: 'MDR-TRSF-33211',
    status: 'unmatched',
    matchConfidence: 50,
    matchReason: 'Diterima dari CV Nusantara Digital Kreasi (Belum ada invoice aktif yang sesuai)',
  },
];

export const initialSequences = {
  invoice: 5,
  payment: 2,
  billingLetter: 1,
  receipt: 2,
  customer: 5,
  product: 5,
  quotation: 0,
  purchaseOrder: 0,
  salesOrder: 0,
  deliveryOrder: 0,
  bast: 0,
};

// Storage Service Wrapper
/**
 * Tracks entities that failed to sync to Supabase so the UI can surface a
 * "pending sync" / "sync failed" indicator instead of losing the failure
 * silently in the console (the previous behavior). Keyed by `${table}:${id}`.
 */
export interface SyncFailure {
  table: string;
  id: string;
  label: string;
  error: string;
  failedAt: string;
}

export class StorageService {
  private static listeners: Array<() => void> = [];
  private static notifyScheduled = false;
  private static syncFailures: Map<string, SyncFailure> = new Map();
  private static syncStatusListeners: Array<() => void> = [];

  public static subscribeSyncStatus(listener: () => void) {
    this.syncStatusListeners.push(listener);
    return () => {
      this.syncStatusListeners = this.syncStatusListeners.filter((l) => l !== listener);
    };
  }

  private static notifySyncStatus() {
    this.syncStatusListeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Error in sync-status subscriber:', e);
      }
    });
  }

  /** Returns all entities currently in a failed-sync state. */
  public static getSyncFailures(): SyncFailure[] {
    return Array.from(this.syncFailures.values());
  }

  public static hasPendingSyncFailures(): boolean {
    return this.syncFailures.size > 0;
  }

  private static markSyncFailure(table: string, id: string, label: string, error: unknown) {
    const key = `${table}:${id}`;
    this.syncFailures.set(key, {
      table,
      id,
      label,
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    });
    this.notifySyncStatus();
  }

  private static clearSyncFailure(table: string, id: string) {
    const key = `${table}:${id}`;
    if (this.syncFailures.delete(key)) {
      this.notifySyncStatus();
    }
  }

  /**
   * Runs a Supabase sync call, and instead of only console.error-ing on
   * failure (the old behavior across this whole file), records it so the UI
   * can show the user something failed and let them retry.
   */
  private static async trackedSync(
    table: string,
    id: string,
    label: string,
    fn: () => Promise<boolean>
  ): Promise<void> {
    try {
      const ok = await fn();
      if (ok) {
        this.clearSyncFailure(table, id);
      } else {
        this.markSyncFailure(table, id, label, 'Supabase menolak permintaan (lihat console untuk detail)');
      }
    } catch (e) {
      console.error(`Gagal sinkron ${table} (${label}) ke Supabase:`, e);
      this.markSyncFailure(table, id, label, e);
    }
  }

  /** Retries every entity currently marked as failed-to-sync. */
  public static async retryFailedSyncs(): Promise<void> {
    const failures = this.getSyncFailures();
    for (const f of failures) {
      if (f.table === 'products') {
        const product = this.getProducts().find((p) => p.id === f.id);
        if (product) this.syncProductToSupabase(product);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'customers') {
        const customer = this.getCustomers().find((c) => c.id === f.id);
        if (customer) this.syncCustomerToSupabase(customer);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'invoices') {
        const invoice = this.getInvoices().find((i) => i.id === f.id);
        if (invoice) this.syncInvoiceToSupabase(invoice);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'payments') {
        const payment = this.getPayments().find((p) => p.id === f.id);
        if (payment) this.syncPaymentToSupabase(payment);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'billing_letters') {
        const letter = this.getBillingLetters().find((l) => l.id === f.id);
        if (letter) this.syncBillingLetterToSupabase(letter);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'documents') {
        const doc = this.getDocuments().find((d) => d.id === f.id);
        if (doc) this.syncDocumentToSupabase(doc);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'organizations') {
        const org = this.getOrganization();
        if (org.id === f.id) this.syncOrganizationToSupabase(org);
        else this.clearSyncFailure(f.table, f.id);
      } else if (f.table === 'vendors') {
        const vendor = this.getVendors().find((v:any) => v.id === f.id);
        if (vendor) {
          const orgId = this.getSyncOrgId();
          if (orgId) this.trackedSync('vendors', vendor.id, vendor.name, () => SupabaseService.saveVendor(vendor, orgId));
        } else this.clearSyncFailure(f.table, f.id);
      }
    }
  }

  public static subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    Promise.resolve().then(() => {
      this.notifyScheduled = false;
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (e) {
          console.error('Error in storage subscriber:', e);
        }
      });
    });
  }

  // Generic getter/setter with fallback
  private static getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        try {
          localStorage.setItem(key, JSON.stringify(fallback));
        } catch (e) {
          console.error(e);
        }
        return fallback;
      }
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private static setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notify();
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // =========================================================================
  // SUPABASE CLOUD SYNC (Customers, Invoices, Payments)
  // =========================================================================
  // localStorage stays as a fast local cache so every existing component can
  // keep reading synchronously. Supabase becomes the source of truth via:
  //  1. hydrateFromSupabase(): pulls fresh data down on login / app load
  //  2. syncXToSupabase(): pushes every create/update/delete up in the background
  private static getSyncOrgId(): string | null {
    const orgId = this.getCurrentUser()?.organizationId;
    return orgId || null;
  }

  private static syncCustomerToSupabase(customer: Customer) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('customers', customer.id, customer.name, () =>
      SupabaseService.saveCustomer(customer, orgId)
    );
  }

  private static syncCustomerDeleteToSupabase(id: string) {
    SupabaseService.deleteCustomer(id).catch((e) =>
      console.error('Gagal menghapus pelanggan di Supabase:', e)
    );
  }

  private static syncInvoiceToSupabase(invoice: Invoice) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('invoices', invoice.id, invoice.invoiceNumber || invoice.id, () =>
      SupabaseService.saveInvoice(invoice, orgId)
    );
  }

  private static syncInvoiceDeleteToSupabase(id: string) {
    SupabaseService.deleteInvoice(id).catch((e) =>
      console.error('Gagal menghapus invoice di Supabase:', e)
    );
  }

  private static syncPaymentToSupabase(payment: Payment) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('payments', payment.id, payment.id, () =>
      SupabaseService.savePayment(payment, orgId)
    );
  }

  private static syncPaymentDeleteToSupabase(id: string) {
    SupabaseService.deletePayment(id).catch((e) =>
      console.error('Gagal menghapus pembayaran di Supabase:', e)
    );
  }

  private static syncProductToSupabase(product: Product) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('products', product.id, product.name, () =>
      SupabaseService.saveProduct(product, orgId)
    );
  }

  private static syncProductDeleteToSupabase(id: string) {
    SupabaseService.deleteProduct(id).catch((e) =>
      console.error('Gagal menghapus produk di Supabase:', e)
    );
  }

  private static syncBillingLetterToSupabase(letter: BillingLetter) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('billing_letters', letter.id, letter.letterNumber, () =>
      SupabaseService.saveBillingLetter(letter, orgId)
    );
  }

  private static syncBillingLetterDeleteToSupabase(id: string) {
    SupabaseService.deleteBillingLetter(id).catch((e) =>
      console.error('Gagal menghapus surat tagihan di Supabase:', e)
    );
  }

  private static syncDocumentToSupabase(doc: DocumentItem) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('documents', doc.id, doc.title, () =>
      SupabaseService.saveDocument(doc, orgId)
    );
  }

  private static syncAuditLogToSupabase(log: AuditLog) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    // Audit logs are append-only (insert, not upsert) and comparatively
    // low-stakes to lose one of vs. spamming retries forever, so this one
    // is intentionally NOT added to the retry-tracked failure list - a
    // failed audit log sync is logged to console but doesn't block or
    // nag the user. It can still be recovered via "Migrate to Cloud" in
    // Settings, which re-pushes every local audit log.
    SupabaseService.saveAuditLog(log, orgId).catch((e) =>
      console.error('Gagal sinkron audit log ke Supabase:', e)
    );
  }

  /**
   * Pulls customers, invoices, payments, and products down from Supabase and
   * overwrites the local cache, so a fresh browser/device sees real data
   * instead of the seeded demo dataset. Only overwrites once we've confirmed
   * we're actually connected & authenticated, so a transient network hiccup
   * never wipes the local cache back to empty.
   */
  /**
   * One-time repair for product records created before this file generated
   * proper UUIDs (e.g. `prod-1735000000000`). Those ids can never be upserted
   * into Supabase's `products.id UUID` column, so this rewrites them to real
   * UUIDs and cascades the change into any invoice line items that reference
   * the old id via `productId`. Safe to call repeatedly - it's a no-op once
   * every id is already a valid UUID.
   *
   * NOTE: kept for backward compatibility (called directly from
   * SettingsView.tsx). It now just delegates to `repairAllLegacyIds()`,
   * which does the same repair across every entity, not just Product -
   * because Billing Letters/Documents have hard foreign keys into
   * Invoices/Customers, so those need fixing too before they can sync.
   */
  public static repairLegacyProductIds(): void {
    this.repairAllLegacyIds();
  }

  /**
   * Repairs every entity id that predates the `generateId()` fix (e.g.
   * `cust-1735000000000`, `inv-1735000000000`) and rewrites every place that
   * references those old ids, across every entity type in the app:
   *
   *   Customer  <- Invoice.customerId, Payment.customerId,
   *                BillingLetter.customerId, Document.customerId
   *   Product   <- InvoiceItem.productId
   *   Invoice   <- Payment.invoiceId, BillingLetter.invoiceId,
   *                Document.referenceId (when documentType !== 'billing_letter')
   *   Payment   <- (no known incoming references)
   *   BillingLetter <- Document.referenceId (when documentType === 'billing_letter')
   *
   * This matters because `billing_letters.invoice_id` and
   * `billing_letters.customer_id` are NOT NULL foreign keys in Postgres -
   * saving a billing letter that points at a non-UUID or nonexistent invoice
   * id fails outright. Safe to call repeatedly; it's a no-op once every id
   * is already a valid UUID.
   */
  public static repairAllLegacyIds(): void {
    let totalFixed = 0;

    // --- Customers ---
    const customers = this.getCustomers();
    const customerIdMap = new Map<string, string>();
    const fixedCustomers = customers.map((c) => {
      if (isValidUUID(c.id)) return c;
      const newId = generateId();
      customerIdMap.set(c.id, newId);
      return { ...c, id: newId };
    });
    if (customerIdMap.size > 0) {
      this.setItem(STORAGE_KEYS.CUSTOMERS, fixedCustomers);
      totalFixed += customerIdMap.size;
    }

    // --- Products ---
    const products = this.getProducts();
    const productIdMap = new Map<string, string>();
    const fixedProducts = products.map((p) => {
      if (isValidUUID(p.id)) return p;
      const newId = generateId();
      productIdMap.set(p.id, newId);
      return { ...p, id: newId };
    });
    if (productIdMap.size > 0) {
      this.setItem(STORAGE_KEYS.PRODUCTS, fixedProducts);
      totalFixed += productIdMap.size;
    }

    // --- Bank Accounts (embedded inside Organization) ---
    const org = this.getOrganization();
    const bankAccountIdMap = new Map<string, string>();
    const fixedBankAccounts = (org.bankAccounts || []).map((b) => {
      if (isValidUUID(b.id)) return b;
      const newId = generateId();
      bankAccountIdMap.set(b.id, newId);
      return { ...b, id: newId };
    });
    if (bankAccountIdMap.size > 0) {
      this.setItem(STORAGE_KEYS.ORGANIZATION, { ...org, bankAccounts: fixedBankAccounts });
      totalFixed += bankAccountIdMap.size;
    }

    // --- Invoices (ids + cascaded customerId/productId/bankAccountId references) ---
    const invoices = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    const invoiceIdMap = new Map<string, string>();
    let invoicesChanged = false;
    const fixedInvoices = invoices.map((inv) => {
      let changed = false;
      let id = inv.id;
      if (!isValidUUID(id)) {
        id = generateId();
        invoiceIdMap.set(inv.id, id);
        changed = true;
      }
      let customerId = inv.customerId;
      if (customerIdMap.has(customerId)) {
        customerId = customerIdMap.get(customerId)!;
        changed = true;
      }
      let bankAccountId = inv.bankAccountId;
      if (bankAccountId && bankAccountIdMap.has(bankAccountId)) {
        bankAccountId = bankAccountIdMap.get(bankAccountId);
        changed = true;
      }
      let items = inv.items;
      if (items && items.length > 0) {
        let itemsChanged = false;
        items = items.map((item) => {
          if (item.productId && productIdMap.has(item.productId)) {
            itemsChanged = true;
            return { ...item, productId: productIdMap.get(item.productId) };
          }
          return item;
        });
        if (itemsChanged) changed = true;
      }
      if (!changed) return inv;
      invoicesChanged = true;
      return { ...inv, id, customerId, bankAccountId, items };
    });
    if (invoicesChanged) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(fixedInvoices));
      totalFixed += invoiceIdMap.size;
    }

    // --- Payments (ids + cascaded invoiceId/customerId/bankAccountId references) ---
    const payments = this.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
    const paymentIdMap = new Map<string, string>();
    let paymentsChanged = false;
    const fixedPayments = payments.map((pay) => {
      let changed = false;
      let id = pay.id;
      if (!isValidUUID(id)) {
        id = generateId();
        paymentIdMap.set(pay.id, id);
        changed = true;
      }
      let invoiceId = pay.invoiceId;
      if (invoiceIdMap.has(invoiceId)) {
        invoiceId = invoiceIdMap.get(invoiceId)!;
        changed = true;
      }
      let customerId = pay.customerId;
      if (customerIdMap.has(customerId)) {
        customerId = customerIdMap.get(customerId)!;
        changed = true;
      }
      let bankAccountId = pay.bankAccountId;
      if (bankAccountId && bankAccountIdMap.has(bankAccountId)) {
        bankAccountId = bankAccountIdMap.get(bankAccountId);
        changed = true;
      }
      if (!changed) return pay;
      paymentsChanged = true;
      return { ...pay, id, invoiceId, customerId, bankAccountId };
    });
    if (paymentsChanged) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(fixedPayments));
      totalFixed += paymentIdMap.size;
    }

    // --- Billing Letters (ids + cascaded invoiceId/customerId references) ---
    const billingLetters = this.getBillingLetters();
    const billingLetterIdMap = new Map<string, string>();
    let lettersChanged = false;
    const fixedLetters = billingLetters.map((l) => {
      let changed = false;
      let id = l.id;
      if (!isValidUUID(id)) {
        id = generateId();
        billingLetterIdMap.set(l.id, id);
        changed = true;
      }
      let invoiceId = l.invoiceId;
      if (invoiceIdMap.has(invoiceId)) {
        invoiceId = invoiceIdMap.get(invoiceId)!;
        changed = true;
      }
      let customerId = l.customerId;
      if (customerIdMap.has(customerId)) {
        customerId = customerIdMap.get(customerId)!;
        changed = true;
      }
      if (!changed) return l;
      lettersChanged = true;
      return { ...l, id, invoiceId, customerId };
    });
    if (lettersChanged) {
      this.setItem(STORAGE_KEYS.BILLING_LETTERS, fixedLetters);
      totalFixed += billingLetterIdMap.size;
    }

    // --- Documents (ids + cascaded customerId/referenceId references) ---
    const documents = this.getDocuments();
    let docsChanged = false;
    const fixedDocuments = documents.map((d) => {
      let changed = false;
      let id = d.id;
      if (!isValidUUID(id)) {
        id = generateId();
        changed = true;
      }
      let customerId = d.customerId;
      if (customerId && customerIdMap.has(customerId)) {
        customerId = customerIdMap.get(customerId);
        changed = true;
      }
      let referenceId = d.referenceId;
      if (referenceId) {
        if (d.documentType === 'billing_letter' && billingLetterIdMap.has(referenceId)) {
          referenceId = billingLetterIdMap.get(referenceId);
          changed = true;
        } else if (invoiceIdMap.has(referenceId)) {
          referenceId = invoiceIdMap.get(referenceId);
          changed = true;
        } else if (!isValidUUID(referenceId)) {
          // Points at something we have no mapping for (already-deleted
          // record, etc). Null it out rather than sending an invalid UUID
          // to a UUID column.
          referenceId = undefined;
          changed = true;
        }
      }
      if (!changed) return d;
      docsChanged = true;
      return { ...d, id, customerId, referenceId };
    });
    if (docsChanged) {
      this.setItem(STORAGE_KEYS.DOCUMENTS, fixedDocuments);
    }

    // --- Bank Transactions (ids + cascaded bankAccountId/matchedPaymentId/matchedInvoiceId) ---
    const bankTxs = this.getBankTransactions();
    let bankTxsChanged = false;
    const fixedBankTxs = bankTxs.map((t) => {
      let changed = false;
      let id = t.id;
      if (!isValidUUID(id)) {
        id = generateId();
        changed = true;
      }
      let bankAccountId = t.bankAccountId;
      if (bankAccountId && bankAccountIdMap.has(bankAccountId)) {
        bankAccountId = bankAccountIdMap.get(bankAccountId)!;
        changed = true;
      }
      let matchedPaymentId = t.matchedPaymentId;
      if (matchedPaymentId && paymentIdMap.has(matchedPaymentId)) {
        matchedPaymentId = paymentIdMap.get(matchedPaymentId);
        changed = true;
      }
      let matchedInvoiceId = t.matchedInvoiceId;
      if (matchedInvoiceId && invoiceIdMap.has(matchedInvoiceId)) {
        matchedInvoiceId = invoiceIdMap.get(matchedInvoiceId);
        changed = true;
      }
      if (!changed) return t;
      bankTxsChanged = true;
      return { ...t, id, bankAccountId, matchedPaymentId, matchedInvoiceId };
    });
    if (bankTxsChanged) {
      this.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, fixedBankTxs);
    }

    if (totalFixed > 0) {
      console.info(`Memperbaiki ${totalFixed} ID lama (dan referensinya) agar kompatibel dengan Supabase.`);
    }
  }

  public static async hydrateFromSupabase(organizationId?: string | null): Promise<boolean> {
    try {
      this.repairAllLegacyIds();
      const status = await SupabaseService.checkConnection();
      if (!status.connected || !status.authenticated) {
        return false;
      }

      const orgId = organizationId || this.getSyncOrgId();
      if (!orgId) return false;

      const [customers, invoices, payments, products, billingLetters, documents, businessDocuments, auditLogs, organization, vendors, purchases] = await Promise.all([
        SupabaseService.fetchCustomers(orgId),
        SupabaseService.fetchInvoices(orgId),
        SupabaseService.fetchPayments(orgId),
        SupabaseService.fetchProducts(orgId),
        SupabaseService.fetchBillingLetters(orgId),
        SupabaseService.fetchDocuments(orgId),
        SupabaseService.fetchBusinessDocuments(orgId),
        SupabaseService.fetchAuditLogs(orgId),
        SupabaseService.getOrganization(orgId),
        SupabaseService.fetchVendors(orgId),
        SupabaseService.fetchPurchases(orgId),
      ]);

      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
      // Products, billing letters, documents, audit logs: only overwrite the
      // local cache if Supabase actually returned something (or we know the
      // org genuinely has none yet). An empty array here could also mean the
      // fetch swallowed an error internally, so we only trust it once
      // connection+auth are confirmed above.
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      if (vendors !== null) localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
      if (purchases !== null) localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
      localStorage.setItem(STORAGE_KEYS.BILLING_LETTERS, JSON.stringify(billingLetters));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
      localStorage.setItem(STORAGE_KEYS.BUSINESS_DOCUMENTS, JSON.stringify(businessDocuments));
      // Audit logs are append-only and capped locally at 200 entries for UI
      // performance; Supabase is the real source of truth for full history.
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      // Organization: only overwrite if Supabase actually has a row for
      // this org (a brand-new org right after signup may not be pushed
      // yet - don't clobber local settings with null in that case).
      if (organization) {
        localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(organization));
      }
      // NOTE: Bank Reconciliation (bank_transactions) is intentionally NOT
      // synced yet - deprioritized for now. See supabase/migration_v3_bank_transactions.sql
      // (schema + SupabaseService methods exist and are ready) for when this
      // resumes; storage.ts's own bank-transaction CRUD is untouched and
      // still 100% localStorage in the meantime.
      this.recalculateCustomerBalances();
      this.notify();
      return true;
    } catch (e) {
      console.error('Gagal memuat data dari Supabase, memakai cache lokal:', e);
      return false;
    }
  }

  // Organization
  public static getOrganization(): Organization {
    return this.getItem<Organization>(STORAGE_KEYS.ORGANIZATION, initialOrganization);
  }

  public static saveOrganization(org: Organization): Organization {
    this.setItem(STORAGE_KEYS.ORGANIZATION, org);
    this.addAuditLog('update', 'settings', org.id, org.name, 'Memperbarui profil dan konfigurasi organisasi');
    this.syncOrganizationToSupabase(org);
    return org;
  }

  public static updateOrganization(org: Partial<Organization>): Organization {
    const current = this.getOrganization();
    const updated = { ...current, ...org };
    this.setItem(STORAGE_KEYS.ORGANIZATION, updated);
    this.addAuditLog('update', 'settings', updated.id, updated.name, 'Memperbarui profil dan konfigurasi organisasi');
    this.syncOrganizationToSupabase(updated);
    return updated;
  }

  private static syncOrganizationToSupabase(org: Organization) {
    // Organization doesn't use getSyncOrgId() (which reads the CURRENT
    // user's org) because org.id itself IS the org id here - and because
    // this can run before a full login (e.g. right after signup), we sync
    // whenever org.id looks like a real UUID rather than the local-only
    // 'legacy local placeholder' placeholder used before any cloud org exists.
    if (!isValidUUID(org.id)) return;
    this.trackedSync('organizations', org.id, org.name, () => SupabaseService.saveOrganization(org));
  }

  // User Profile
  public static getUser(): UserProfile {
    return this.getItem<UserProfile>(STORAGE_KEYS.USER, initialUser);
  }

  public static getCurrentUser(): UserProfile {
    return this.getUser();
  }

  public static saveUser(user: UserProfile): UserProfile {
    this.setItem(STORAGE_KEYS.USER, user);
    return user;
  }

  public static setCurrentUser(user: UserProfile): UserProfile {
    return this.saveUser(user);
  }

  public static updateUserRole(role: UserProfile['role']): UserProfile {
    const current = this.getUser();
    const updated = { ...current, role };
    this.setItem(STORAGE_KEYS.USER, updated);
    this.addAuditLog('update', 'auth', updated.id, updated.name, `Mengubah role aktif menjadi: ${role.toUpperCase()}`);
    return updated;
  }

  // Customers
  public static getCustomers(): Customer[] {
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  }

  public static getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  public static async saveCustomer(customerData: Omit<Customer, 'id' | 'totalInvoiced' | 'totalPaid' | 'totalOutstanding' | 'createdAt'> & { id?: string }): Promise<Customer> {
    const customers = this.getCustomers();
    const sequences = this.getSequences();
    let customer: Customer;

    if (customerData.id) {
      const index = customers.findIndex((c) => c.id === customerData.id);
      if (index !== -1) {
        customer = {
          ...customers[index],
          ...customerData,
        };
        customers[index] = customer;
        this.addAuditLog('update', 'customers', customer.id, customer.name, `Memperbarui data pelanggan: ${customer.name}`);
      } else {
        throw new Error('Customer not found');
      }
    } else {
      // Atomic sequence reservation - see saveInvoice() for the full
      // rationale. Falls back to the local counter when Supabase isn't
      // configured/reachable, so the app still works offline.
      const atomicSeq = await SupabaseService.getNextSequence('customer', sequences.customer);
      const newSeq = atomicSeq !== null ? atomicSeq : sequences.customer + 1;
      this.updateSequences({ customer: newSeq });
      customer = {
        ...customerData,
        id: generateId(),
        code: customerData.code || `CUST-${String(newSeq).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
      };
      customers.unshift(customer);
      this.addAuditLog('create', 'customers', customer.id, customer.name, `Menambahkan pelanggan baru: ${customer.name}`);
    }

    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
    this.syncCustomerToSupabase(customer);
    return customer;
  }

  public static deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const target = customers.find((c) => c.id === id);
    if (!target) return false;

    const filtered = customers.filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CUSTOMERS, filtered);
    this.addAuditLog('delete', 'customers', id, target.name, `Menghapus pelanggan: ${target.name}`);
    this.syncCustomerDeleteToSupabase(id);
    return true;
  }

  // Products
  public static getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  }

  public static async saveProduct(productData: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const products = this.getProducts();
    const sequences = this.getSequences();
    let product: Product;

    if (productData.id) {
      const index = products.findIndex((p) => p.id === productData.id);
      if (index !== -1) {
        product = { ...products[index], ...productData };
        products[index] = product;
        this.addAuditLog('update', 'products', product.id, product.name, `Memperbarui produk/jasa: ${product.name}`);
      } else {
        throw new Error('Product not found');
      }
    } else {
      // Atomic sequence reservation - see saveInvoice() for the full
      // rationale. NOTE: previously this counter was incremented but never
      // actually used to build product.code (the caller generated its own
      // Date.now()-based fallback, which was itself collision-prone across
      // devices) - now the code is always derived from the reserved
      // sequence number unless the user typed a custom code explicitly.
      const atomicSeq = await SupabaseService.getNextSequence('product', sequences.product);
      const newSeq = atomicSeq !== null ? atomicSeq : sequences.product + 1;
      this.updateSequences({ product: newSeq });
      product = {
        ...productData,
        code: productData.code && productData.code.trim() ? productData.code.trim() : `PRD-${String(newSeq).padStart(4, '0')}`,
        id: generateId(),
      };
      products.unshift(product);
      this.addAuditLog('create', 'products', product.id, product.name, `Menambahkan produk/jasa baru: ${product.name}`);
    }

    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.syncProductToSupabase(product);
    return product;
  }

  public static deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const target = products.find((p) => p.id === id);
    if (!target) return false;
    const filtered = products.filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PRODUCTS, filtered);
    this.addAuditLog('delete', 'products', id, target.name, `Menghapus master produk: ${target.name}`);
    this.syncProductDeleteToSupabase(id);
    return true;
  }

  public static async adjustProductStock(productId: string, delta: number, note: string): Promise<Product> {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx < 0) throw new Error('Produk tidak ditemukan.');
    const current = products[idx];
    if (!current.trackInventory) throw new Error('Produk ini tidak menggunakan pelacakan persediaan.');
    if (!delta || !Number.isFinite(delta)) throw new Error('Perubahan stok tidak valid.');
    const next = (current.stockQty ?? 0) + delta;
    if (next < 0) throw new Error('Stok tidak boleh negatif.');

    // Cloud is authoritative when the authenticated Supabase path is available.
    const orgId = this.getSyncOrgId();
    if (orgId) {
      const ok = await SupabaseService.adjustProductStock(productId, delta, note);
      if (ok) {
        const updated = { ...current, stockQty: next };
        products[idx] = updated;
        this.setItem(STORAGE_KEYS.PRODUCTS, products);
        this.addAuditLog('update', 'products', productId, current.name, `Penyesuaian stok ${delta > 0 ? '+' : ''}${delta} ${current.unit}. ${note}`);
        return updated;
      }
    }

    const updated = { ...current, stockQty: next };
    products[idx] = updated;
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.addAuditLog('update', 'products', productId, current.name, `Penyesuaian stok lokal ${delta > 0 ? '+' : ''}${delta} ${current.unit}. ${note}`);
    this.syncProductToSupabase(updated);
    return updated;
  }

  private static applyLocalInvoiceInventory(invoice: Invoice): void {
    if (invoice.status === 'draft') return;
    const products = this.getProducts();
    const movements = this.getItem<any[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
    const existing = movements.filter((m) => m.referenceType === 'invoice' && m.referenceId === invoice.id && m.movementType === 'SALE');
    const byProduct = new Map<string, number>();
    existing.forEach((m) => byProduct.set(m.productId, (byProduct.get(m.productId) || 0) + Number(m.quantity || 0)));

    // Reverse the previous local sale first; then post the current item set.
    if (existing.length) {
      existing.forEach((m) => {
        const product = products.find((p) => p.id === m.productId);
        if (product) product.stockQty = Number(product.stockQty || 0) - Number(m.quantity || 0);
      });
      const kept = movements.filter((m) => !(m.referenceType === 'invoice' && m.referenceId === invoice.id && m.movementType === 'SALE'));
      movements.splice(0, movements.length, ...kept);
    }
    if (invoice.status === 'cancelled') {
      this.setItem(STORAGE_KEYS.PRODUCTS, products);
      this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements);
      return;
    }

    const date = invoice.issueDate;
    for (const item of invoice.items || []) {
      if (!item.productId || !item.quantity) continue;
      const product = products.find((p) => p.id === item.productId);
      if (!product?.trackInventory) continue;
      const qty = Number(item.quantity);
      const stock = Number(product.stockQty || 0);
      if (stock < qty) throw new Error(`Stok tidak cukup untuk ${product.name} (tersedia ${stock}, diminta ${qty}).`);
      const unitCost = Number(product.costPrice || 0);
      product.stockQty = stock - qty;
      movements.push({
        id: generateId(), productId: product.id, movementDate: date, movementType: 'SALE',
        quantity: -qty, unitCost, referenceType: 'invoice', referenceId: invoice.id,
        notes: `Penjualan melalui invoice ${invoice.invoiceNumber}`, createdAt: new Date().toISOString(),
      });
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements);
  }

  public static getInventoryMovements(): any[] {
    return this.getItem<any[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  }

  public static async recordInventoryReceipt(data: { productId: string; quantity: number; unitCost: number; movementType: 'OPENING'|'PURCHASE'|'RETURN_IN'|'ADJUSTMENT_IN'; movementDate?: string; notes?: string }): Promise<Product> {
    if (data.quantity <= 0) throw new Error('Jumlah stok masuk harus lebih dari 0.');
    if (data.unitCost < 0) throw new Error('Harga pokok tidak boleh negatif.');
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === data.productId);
    if (idx < 0) throw new Error('Produk tidak ditemukan.');
    const current = products[idx];
    if (!current.trackInventory) throw new Error('Produk ini tidak menggunakan pelacakan persediaan.');
    const date = data.movementDate || new Date().toISOString().slice(0,10);
    const orgId = this.getSyncOrgId();
    if (orgId) {
      const result = await SupabaseService.recordInventoryReceipt(data.productId, data.quantity, data.unitCost, data.movementType, date, 'inventory_receipt', undefined, data.notes);
      if (result) {
        const updated = { ...current, stockQty: Number(result.stock_qty ?? ((current.stockQty || 0) + data.quantity)), costPrice: Number(result.cost_price ?? current.costPrice ?? data.unitCost) };
        products[idx] = updated; this.setItem(STORAGE_KEYS.PRODUCTS, products);
        this.addAuditLog('update','products',current.id,current.name,`Stok masuk +${data.quantity} ${current.unit}. HPP rata-rata ${updated.costPrice}.`);
        return updated;
      }
    }
    const oldQty = Number(current.stockQty || 0), oldCost = Number(current.costPrice || 0);
    const newQty = oldQty + data.quantity;
    const newCost = oldQty <= 0 ? data.unitCost : Math.round(((oldQty*oldCost)+(data.quantity*data.unitCost))/newQty*100)/100;
    const movements = this.getInventoryMovements();
    movements.push({ id: generateId(), productId: current.id, movementDate: date, movementType: data.movementType, quantity: data.quantity, unitCost: data.unitCost, referenceType:'inventory_receipt', notes:data.notes || '', createdAt:new Date().toISOString() });
    const updated = { ...current, stockQty:newQty, costPrice:newCost };
    products[idx]=updated; this.setItem(STORAGE_KEYS.PRODUCTS,products); this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS,movements);
    this.addAuditLog('update','products',current.id,current.name,`Stok masuk lokal +${data.quantity} ${current.unit}.`);
    return updated;
  }

  // Sequences
  public static getSequences() {
    return this.getItem(STORAGE_KEYS.SEQUENCES, initialSequences);
  }

  public static updateSequences(partial: Partial<typeof initialSequences>) {
    const current = this.getSequences();
    this.setItem(STORAGE_KEYS.SEQUENCES, { ...current, ...partial });
  }

  // Invoices
  public static getInvoices(): Invoice[] {
    const invoices = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    // Dynamic overdue check
    const todayStr = new Date().toISOString().split('T')[0];
    let hasChanges = false;

    const updated = invoices.map((inv) => {
      if (
        (inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'viewed') &&
        inv.dueDate < todayStr &&
        inv.outstandingAmount > 0
      ) {
        hasChanges = true;
        return { ...inv, status: 'overdue' as const };
      }
      return inv;
    });

    if (hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    return updated;
  }

  public static getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((inv) => inv.id === id);
  }

  public static async saveInvoice(invoiceData: Partial<Invoice> & { customerId: string; items: InvoiceItem[] }): Promise<Invoice> {
    const invoices = this.getInvoices();
    const org = this.getOrganization();
    const customer = this.getCustomerById(invoiceData.customerId);
    const sequences = this.getSequences();

    if (!customer) throw new Error('Customer tidak valid');

    // Recalculate totals. Tax is computed PER ITEM using each line's own
    // taxRate (not a single invoice-wide rate) - this matters when an
    // invoice mixes items with different PPN treatment (e.g. 11% standar
    // vs 0% ekspor/non-PKP). The invoice-level discount is prorated across
    // items by their share of the subtotal before each item's tax is applied.
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      invoiceData.discountType === 'percentage'
        ? (subtotal * (invoiceData.discountValue || 0)) / 100
        : invoiceData.discountValue || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    let taxAmount = 0;
    if (subtotal > 0) {
      for (const item of invoiceData.items) {
        const itemDiscountShare = discountAmount * (item.amount / subtotal);
        const itemTaxable = Math.max(0, item.amount - itemDiscountShare);
        taxAmount += (itemTaxable * (item.taxRate || 0)) / 100;
      }
    }

    // invoice.taxRate stays a single summary number for display/reporting
    // (e.g. the "PPN (11%)" line on the printout): if every item shares the
    // same rate it's that rate; if rates are mixed, it's the effective
    // blended rate (taxAmount / taxableAmount) so grandTotal-related displays
    // that multiply taxableAmount * taxRate still land on the right figure.
    const distinctItemRates = Array.from(new Set(invoiceData.items.map((i) => i.taxRate ?? 0)));
    const taxRate =
      distinctItemRates.length === 1
        ? distinctItemRates[0]
        : taxableAmount > 0
        ? Math.round((taxAmount / taxableAmount) * 10000) / 100
        : invoiceData.taxRate !== undefined
        ? invoiceData.taxRate
        : org.defaultTaxRate;

    const additionalCharges = invoiceData.additionalCharges || 0;
    const grandTotal = taxableAmount + taxAmount + additionalCharges;

    let invoice: Invoice;

    if (invoiceData.id) {
      const index = invoices.findIndex((i) => i.id === invoiceData.id);
      if (index === -1) throw new Error('Invoice tidak ditemukan');
      const existing = invoices[index];
      const paidAmount = existing.paidAmount || 0;
      const outstandingAmount = Math.max(0, grandTotal - paidAmount);

      let status = existing.status;
      if (paidAmount >= grandTotal) {
        status = 'paid';
      } else if (paidAmount > 0) {
        status = 'partially_paid';
      } else if (invoiceData.dueDate && invoiceData.dueDate < new Date().toISOString().split('T')[0]) {
        status = 'overdue';
      }

      invoice = {
        ...existing,
        ...invoiceData,
        customerName: customer.name,
        customerCompanyName: customer.companyName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerNpwp: customer.npwp,
        subtotal,
        discountAmount,
        taxableAmount,
        taxAmount,
        grandTotal,
        paidAmount,
        outstandingAmount,
        status,
        updatedAt: new Date().toISOString(),
      };
      invoices[index] = invoice;
      this.addAuditLog('update', 'invoices', invoice.id, invoice.invoiceNumber, `Memperbarui invoice: ${invoice.invoiceNumber}`);
    } else {
      // Atomic sequence reservation: ask Supabase for the next invoice
      // number via a server-side function that increments under a row
      // lock (see migration_v4_atomic_sequences.sql), so two devices
      // creating an invoice at the same moment can never receive the same
      // number. Falls back to the old local-counter behavior if Supabase
      // isn't configured/reachable/migrated yet - so the app still works
      // offline, just without the cross-device collision guarantee.
      const atomicSeq = await SupabaseService.getNextSequence('invoice', sequences.invoice);
      const newSeq = atomicSeq !== null ? atomicSeq : sequences.invoice + 1;
      this.updateSequences({ invoice: newSeq });
      const invoiceNumber = formatDocNumber(org.invoiceFormat, newSeq);

      invoice = {
        id: generateId(),
        invoiceNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerCompanyName: customer.companyName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerNpwp: customer.npwp,
        issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
        poNumber: invoiceData.poNumber,
        referenceNumber: invoiceData.referenceNumber,
        notes: invoiceData.notes || 'Terima kasih atas kerja sama Anda.',
        paymentTerms: invoiceData.paymentTerms || `Net ${org.defaultPaymentTermsDays} Hari`,
        items: invoiceData.items,
        subtotal,
        discountType: invoiceData.discountType || 'fixed',
        discountValue: invoiceData.discountValue || 0,
        discountAmount,
        taxableAmount,
        taxRate,
        taxAmount,
        additionalCharges,
        grandTotal,
        paidAmount: 0,
        outstandingAmount: grandTotal,
        status: invoiceData.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bankAccountId: invoiceData.bankAccountId || org.bankAccounts[0]?.id,
      };

      invoices.unshift(invoice);

      // Create document entry
      this.addDocument({
        title: `Faktur Penagihan - ${customer.name}`,
        documentType: 'invoice',
        documentNumber: invoice.invoiceNumber,
        customerId: customer.id,
        customerName: customer.name,
        referenceId: invoice.id,
        amount: invoice.grandTotal,
        date: invoice.issueDate,
        status: 'Draft',
      });

      this.addAuditLog('create', 'invoices', invoice.id, invoice.invoiceNumber, `Menerbitkan invoice ${invoice.invoiceNumber} senilai Rp${grandTotal.toLocaleString('id-ID')}`);
      this.addNotification({
        title: 'Invoice Dibuat',
        message: `Invoice ${invoice.invoiceNumber} berhasil dibuat untuk ${customer.name}.`,
        type: 'info',
        linkModule: 'invoices',
        linkId: invoice.id,
      });
    }

    this.setItem(STORAGE_KEYS.INVOICES, invoices);
    this.recalculateCustomerBalances();
    if (invoice.status !== 'draft') this.applyLocalInvoiceInventory(invoice);
    this.syncInvoiceToSupabase(invoice);
    return invoice;
  }

  public static updateInvoiceStatus(id: string, status: Invoice['status']): Invoice | undefined {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    const inv = invoices[index];
    const oldStatus = inv.status;
    inv.status = status;
    inv.updatedAt = new Date().toISOString();

    if (status === 'sent' && !inv.sentAt) inv.sentAt = new Date().toISOString();
    if (status === 'viewed' && !inv.viewedAt) inv.viewedAt = new Date().toISOString();

    invoices[index] = inv;
    this.setItem(STORAGE_KEYS.INVOICES, invoices);
    this.addAuditLog('status_change', 'invoices', id, inv.invoiceNumber, `Mengubah status invoice ${inv.invoiceNumber} dari ${oldStatus} ke ${status}`);
    this.recalculateCustomerBalances();
    if (status !== 'draft') this.applyLocalInvoiceInventory(inv);
    this.syncInvoiceToSupabase(inv);
    return inv;
  }

  public static deleteInvoice(id: string): boolean {
    const invoices = this.getInvoices();
    const target = invoices.find((i) => i.id === id);
    if (!target) return false;

    // Check if payments exist
    const payments = this.getPayments().filter((p) => p.invoiceId === id);
    if (payments.length > 0) {
      throw new Error('Tidak dapat menghapus invoice yang sudah memiliki riwayat pembayaran.');
    }

    const filtered = invoices.filter((i) => i.id !== id);
    this.setItem(STORAGE_KEYS.INVOICES, filtered);
    this.addAuditLog('delete', 'invoices', id, target.invoiceNumber, `Menghapus invoice: ${target.invoiceNumber}`);
    this.recalculateCustomerBalances();
    this.syncInvoiceDeleteToSupabase(id);
    return true;
  }

  // Payments
  public static getPayments(): Payment[] {
    return this.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
  }

  public static async recordPayment(paymentData: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: Payment['paymentMethod'];
    destinationBank?: string;
    bankAccountId?: string;
    accountNumber?: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<Payment> {
    const invoice = this.getInvoiceById(paymentData.invoiceId);
    if (!invoice) throw new Error('Invoice tidak ditemukan');

    if (paymentData.amount <= 0) throw new Error('Nominal pembayaran harus lebih dari 0');
    if (paymentData.amount > invoice.outstandingAmount) {
      throw new Error(`Nominal pembayaran melebihi sisa tagihan (${invoice.outstandingAmount})`);
    }

    const org = this.getOrganization();
    const user = this.getUser();

    // -----------------------------------------------------------------
    // PRIMARY PATH: single atomic Postgres transaction (payment insert +
    // invoice update + document insert + audit log insert all-or-nothing;
    // see supabase/migration_v5_atomic_payment.sql). If this throws, it's
    // a real business-rule rejection from the server (e.g. amount now
    // exceeds outstanding after a concurrent payment) and should surface
    // to the user as-is, not be swallowed into a local fallback.
    // recordPaymentAtomic() itself returns null (rather than throwing)
    // when Supabase isn't configured, there's no live auth session (demo
    // mode), or the RPC isn't deployed yet - all cases where we should
    // fall back below instead.
    // -----------------------------------------------------------------
    const atomicResult = await SupabaseService.recordPaymentAtomic({
      invoiceId: invoice.id,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      destinationBank: paymentData.destinationBank,
      bankAccountId: paymentData.bankAccountId,
      accountNumber: paymentData.accountNumber,
      referenceNumber: paymentData.referenceNumber,
      notes: paymentData.notes,
    });

    if (atomicResult) {
      const payment: Payment = {
        id: atomicResult.payment_id,
        paymentNumber: atomicResult.payment_number,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        destinationBank: atomicResult.destination_bank,
        bankAccountId: paymentData.bankAccountId,
        accountNumber: paymentData.accountNumber,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        receivedBy: atomicResult.received_by,
        recordedBy: atomicResult.received_by,
        receiptNumber: atomicResult.receipt_number,
        createdAt: new Date().toISOString(),
      };

      // Everything below only updates the LOCAL CACHE to match what the
      // server already committed - it does not re-push to Supabase
      // (that would be redundant, the RPC already wrote it).
      const payments = this.getPayments();
      payments.unshift(payment);
      this.setItem(STORAGE_KEYS.PAYMENTS, payments);

      const invoices = this.getInvoices();
      const invIndex = invoices.findIndex((i) => i.id === invoice.id);
      if (invIndex !== -1) {
        invoices[invIndex] = {
          ...invoices[invIndex],
          paidAmount: atomicResult.paid_amount,
          outstandingAmount: atomicResult.outstanding_amount,
          status: atomicResult.status as Invoice['status'],
          paidAt: atomicResult.paid_at || undefined,
        };
        this.setItem(STORAGE_KEYS.INVOICES, invoices);
      }

      const documents = this.getDocuments();
      documents.unshift({
        id: atomicResult.document_id,
        title: `Kuitansi Penerimaan Pembayaran - ${invoice.customerName}`,
        documentType: 'payment_receipt',
        documentNumber: atomicResult.receipt_number,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        referenceId: payment.id,
        amount: payment.amount,
        date: payment.paymentDate,
        status: atomicResult.status === 'paid' ? 'Lunas' : 'Dibayar Sebagian',
        createdAt: new Date().toISOString(),
      });
      this.setItem(STORAGE_KEYS.DOCUMENTS, documents);

      const auditLogs = this.getAuditLogs();
      auditLogs.unshift({
        id: generateId(),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'pay',
        module: 'payments',
        recordId: payment.id,
        recordTitle: payment.paymentNumber,
        details: `Mencatat pembayaran Rp${payment.amount.toLocaleString('id-ID')} untuk ${invoice.invoiceNumber} (${invoice.customerName})`,
        timestamp: new Date().toISOString(),
      });
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, auditLogs);

      this.addNotification({
        title: 'Pembayaran Diterima',
        message: `Pembayaran Rp${payment.amount.toLocaleString('id-ID')} untuk ${invoice.invoiceNumber} telah dicatat.`,
        type: 'success',
        linkModule: 'payments',
        linkId: payment.id,
      });

      this.recalculateCustomerBalances();
      return payment;
    }

    // -----------------------------------------------------------------
    // FALLBACK PATH: Supabase not configured / no session (demo mode) /
    // atomic RPC not deployed yet. Same behaviour as before this change -
    // sequential local writes, each individually synced to Supabase in
    // the background. Not atomic, but there's no server transaction to
    // be atomic with in these cases anyway.
    // -----------------------------------------------------------------
    const sequences = this.getSequences();

    // Atomic sequence reservation for both the payment number and the
    // receipt/kuitansi number - see saveInvoice() for the full rationale.
    // Each call takes its own row lock under a distinct sequence_name
    // ('payment' / 'receipt'), so this is safe to await sequentially.
    const atomicPaySeq = await SupabaseService.getNextSequence('payment', sequences.payment);
    const newPaySeq = atomicPaySeq !== null ? atomicPaySeq : sequences.payment + 1;
    const atomicReceiptSeq = await SupabaseService.getNextSequence('receipt', sequences.receipt);
    const newReceiptSeq = atomicReceiptSeq !== null ? atomicReceiptSeq : sequences.receipt + 1;
    this.updateSequences({ payment: newPaySeq, receipt: newReceiptSeq });

    const paymentNumber = `PAY/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(newPaySeq).padStart(5, '0')}`;
    const receiptNumber = formatDocNumber(org.paymentReceiptFormat, newReceiptSeq);

    const destinationBank = paymentData.destinationBank || org.bankAccounts.find(b => b.id === paymentData.bankAccountId)?.bankName || 'Bank Transfer';

    const payment: Payment = {
      id: generateId(),
      paymentNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      paymentDate: paymentData.paymentDate,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      destinationBank,
      bankAccountId: paymentData.bankAccountId,
      accountNumber: paymentData.accountNumber,
      referenceNumber: paymentData.referenceNumber,
      notes: paymentData.notes,
      receivedBy: `${user.name} (${user.role.toUpperCase()})`,
      recordedBy: `${user.name} (${user.role.toUpperCase()})`,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    const payments = this.getPayments();
    payments.unshift(payment);
    this.setItem(STORAGE_KEYS.PAYMENTS, payments);

    // Update invoice balance and status
    const newPaidAmount = invoice.paidAmount + paymentData.amount;
    const newOutstandingAmount = Math.max(0, invoice.grandTotal - newPaidAmount);
    const newStatus = newOutstandingAmount <= 0 ? 'paid' : 'partially_paid';

    this.saveInvoice({
      ...invoice,
      paidAmount: newPaidAmount,
      outstandingAmount: newOutstandingAmount,
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
    });

    // Create Payment Receipt Document
    this.addDocument({
      title: `Kuitansi Penerimaan Pembayaran - ${invoice.customerName}`,
      documentType: 'payment_receipt',
      documentNumber: receiptNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      referenceId: payment.id,
      amount: payment.amount,
      date: payment.paymentDate,
      status: newStatus === 'paid' ? 'Lunas' : 'Dibayar Sebagian',
    });

    this.addAuditLog(
      'pay',
      'payments',
      payment.id,
      payment.paymentNumber,
      `Mencatat pembayaran Rp${payment.amount.toLocaleString('id-ID')} untuk ${invoice.invoiceNumber} (${invoice.customerName})`
    );

    this.addNotification({
      title: 'Pembayaran Diterima',
      message: `Pembayaran Rp${payment.amount.toLocaleString('id-ID')} untuk ${invoice.invoiceNumber} telah dicatat.`,
      type: 'success',
      linkModule: 'payments',
      linkId: payment.id,
    });

    this.recalculateCustomerBalances();
    this.syncPaymentToSupabase(payment);
    return payment;
  }

  public static deletePayment(id: string): boolean {
    const payments = this.getPayments();
    const target = payments.find((p) => p.id === id);
    if (!target) return false;

    // Rollback invoice paid amount
    const invoice = this.getInvoiceById(target.invoiceId);
    if (invoice) {
      const newPaidAmount = Math.max(0, invoice.paidAmount - target.amount);
      const newOutstanding = Math.max(0, invoice.grandTotal - newPaidAmount);
      const newStatus = newPaidAmount === 0 ? (invoice.dueDate < new Date().toISOString().split('T')[0] ? 'overdue' : 'sent') : 'partially_paid';

      this.saveInvoice({
        ...invoice,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
        status: newStatus,
      });
    }

    const filtered = payments.filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PAYMENTS, filtered);
    this.addAuditLog('delete', 'payments', id, target.receiptNumber, `Membatalkan kuitansi pembayaran: ${target.receiptNumber}`);
    this.recalculateCustomerBalances();
    this.syncPaymentDeleteToSupabase(id);
    return true;
  }

  // Billing Letters (Surat Tagihan)
  public static getBillingLetters(): BillingLetter[] {
    return this.getItem<BillingLetter[]>(STORAGE_KEYS.BILLING_LETTERS, initialBillingLetters);
  }

  public static async saveBillingLetter(data: {
    id?: string;
    invoiceId: string;
    letterType: BillingLetter['letterType'];
    letterDate: string;
    paymentDeadline?: string;
    extendedDueDate?: string;
    penaltiesAmount?: number;
    subject: string;
    bodyText: string;
    status?: BillingLetter['status'];
  }): Promise<BillingLetter> {
    const letters = this.getBillingLetters();
    const invoice = this.getInvoiceById(data.invoiceId);
    if (!invoice) throw new Error('Invoice tidak ditemukan');

    const org = this.getOrganization();
    const sequences = this.getSequences();

    if (data.id) {
      const index = letters.findIndex((l) => l.id === data.id);
      if (index === -1) throw new Error('Surat tagihan tidak ditemukan');
      const updated: BillingLetter = {
        ...letters[index],
        ...data,
        paymentDeadline: data.paymentDeadline || data.extendedDueDate || letters[index].paymentDeadline,
        penaltiesAmount: data.penaltiesAmount || 0,
      };
      letters[index] = updated;
      this.setItem(STORAGE_KEYS.BILLING_LETTERS, letters);
      this.addAuditLog('update', 'billing_letters', updated.id, updated.letterNumber, `Memperbarui surat tagihan ${updated.letterNumber}`);
      this.syncBillingLetterToSupabase(updated);
      return updated;
    }

    // Atomic sequence reservation for the surat tagihan number - see
    // saveInvoice() for the full rationale.
    const atomicSeq = await SupabaseService.getNextSequence('billingLetter', sequences.billingLetter);
    const newLetterSeq = atomicSeq !== null ? atomicSeq : sequences.billingLetter + 1;
    this.updateSequences({ billingLetter: newLetterSeq });
    const letterNumber = formatDocNumber(org.billingLetterFormat, newLetterSeq);
    const overdueDays = getDaysOverdue(invoice.dueDate);

    const letter: BillingLetter = {
      id: generateId(),
      letterNumber,
      letterType: data.letterType,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerCompanyName: invoice.customerCompanyName,
      customerAddress: invoice.customerAddress,
      customerPic: invoice.customerName,
      letterDate: data.letterDate,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      invoiceDueDate: invoice.dueDate,
      overdueDays,
      totalInvoiceAmount: invoice.grandTotal,
      paidAmount: invoice.paidAmount,
      outstandingAmount: invoice.outstandingAmount,
      penaltiesAmount: data.penaltiesAmount || 0,
      paymentDeadline: data.paymentDeadline || data.extendedDueDate || invoice.dueDate,
      extendedDueDate: data.extendedDueDate || data.paymentDeadline || invoice.dueDate,
      subject: data.subject,
      bodyText: data.bodyText,
      status: data.status || 'sent',
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };

    letters.unshift(letter);
    this.setItem(STORAGE_KEYS.BILLING_LETTERS, letters);
    this.syncBillingLetterToSupabase(letter);

    this.addDocument({
      title: `Surat Tagihan - ${invoice.customerName} (${letterNumber})`,
      documentType: 'billing_letter',
      documentNumber: letterNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      referenceId: letter.id,
      amount: invoice.outstandingAmount + (data.penaltiesAmount || 0),
      date: letter.letterDate,
      status: 'Terkirim',
    });

    this.addAuditLog('create', 'billing_letters', letter.id, letter.letterNumber, `Menerbitkan surat tagihan ${letterNumber} untuk ${invoice.customerName}`);
    return letter;
  }

  public static deleteBillingLetter(id: string): boolean {
    const letters = this.getBillingLetters();
    const target = letters.find((l) => l.id === id);
    if (!target) return false;

    const filtered = letters.filter((l) => l.id !== id);
    this.setItem(STORAGE_KEYS.BILLING_LETTERS, filtered);
    this.addAuditLog('delete', 'billing_letters', id, target.letterNumber, `Menghapus surat tagihan: ${target.letterNumber}`);
    this.syncBillingLetterDeleteToSupabase(id);
    return true;
  }

  public static createBillingLetter(data: {
    invoiceId: string;
    letterType: BillingLetter['letterType'];
    letterDate: string;
    extendedDueDate: string;
    subject: string;
    bodyText: string;
  }): BillingLetter {
    const invoice = this.getInvoiceById(data.invoiceId);
    if (!invoice) throw new Error('Invoice tidak ditemukan');

    const org = this.getOrganization();
    const sequences = this.getSequences();
    const newLetterSeq = sequences.billingLetter + 1;
    this.updateSequences({ billingLetter: newLetterSeq });

    const letterNumber = formatDocNumber(org.billingLetterFormat, newLetterSeq);
    const overdueDays = getDaysOverdue(invoice.dueDate);

    const letter: BillingLetter = {
      id: generateId(),
      letterNumber,
      letterType: data.letterType,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerCompanyName: invoice.customerCompanyName,
      customerAddress: invoice.customerAddress,
      customerPic: invoice.customerName,
      letterDate: data.letterDate,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      invoiceDueDate: invoice.dueDate,
      overdueDays,
      totalInvoiceAmount: invoice.grandTotal,
      paidAmount: invoice.paidAmount,
      outstandingAmount: invoice.outstandingAmount,
      penaltiesAmount: 0,
      paymentDeadline: data.extendedDueDate || invoice.dueDate,
      extendedDueDate: data.extendedDueDate,
      subject: data.subject,
      bodyText: data.bodyText,
      status: 'sent',
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };

    const letters = this.getBillingLetters();
    letters.unshift(letter);
    this.setItem(STORAGE_KEYS.BILLING_LETTERS, letters);
    this.syncBillingLetterToSupabase(letter);

    // Create Document
    this.addDocument({
      title: `Surat Tagihan - ${invoice.customerName} (${letterNumber})`,
      documentType: 'billing_letter',
      documentNumber: letterNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      referenceId: letter.id,
      amount: invoice.outstandingAmount,
      date: letter.letterDate,
      status: 'Terkirim',
    });

    this.addAuditLog('create', 'billing_letters', letter.id, letter.letterNumber, `Menerbitkan surat tagihan ${letterNumber} untuk ${invoice.customerName}`);
    this.addNotification({
      title: 'Surat Tagihan Diterbitkan',
      message: `Surat tagihan ${letterNumber} telah diterbitkan untuk ${invoice.customerName}.`,
      type: 'warning',
      linkModule: 'billing_letters',
      linkId: letter.id,
    });

    return letter;
  }

  // Documents
  public static getDocuments(): DocumentItem[] {
    return this.getItem<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, initialDocuments);
  }

  public static addDocument(doc: Omit<DocumentItem, 'id' | 'createdAt'>): DocumentItem {
    const docs = this.getDocuments();
    const newDoc: DocumentItem = {
      ...doc,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    this.setItem(STORAGE_KEYS.DOCUMENTS, docs);
    this.syncDocumentToSupabase(newDoc);
    return newDoc;
  }

  // Business transaction documents (Quotation / PO / SO / Surat Jalan / BAST)
  public static getBusinessDocuments(): BusinessDocument[] {
    return this.getItem<BusinessDocument[]>(STORAGE_KEYS.BUSINESS_DOCUMENTS, []);
  }

  public static nextBusinessDocumentSequence(key: string): number {
    const current = this.getSequences() as typeof initialSequences & Record<string, number>;
    const next = (Number(current[key]) || 0) + 1;
    this.updateSequences({ [key]: next } as Partial<typeof initialSequences>);
    return next;
  }

  public static addBusinessDocument(doc: BusinessDocument): BusinessDocument {
    const docs = this.getBusinessDocuments();
    docs.unshift(doc);
    this.setItem(STORAGE_KEYS.BUSINESS_DOCUMENTS, docs);
    this.syncBusinessDocumentToSupabase(doc);
    this.addAuditLog('create', 'documents', doc.id, doc.documentNumber, `Membuat ${doc.title}`);
    return doc;
  }

  public static updateBusinessDocument(doc: BusinessDocument): BusinessDocument {
    const docs = this.getBusinessDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) docs[index] = doc; else docs.unshift(doc);
    this.setItem(STORAGE_KEYS.BUSINESS_DOCUMENTS, docs);
    this.syncBusinessDocumentToSupabase(doc);
    this.addAuditLog('update', 'documents', doc.id, doc.documentNumber, `Memperbarui ${doc.title}`);
    return doc;
  }

  private static syncBusinessDocumentToSupabase(doc: BusinessDocument) {
    const orgId = this.getSyncOrgId();
    if (!orgId) return;
    this.trackedSync('business_documents', doc.id, doc.documentNumber, () =>
      SupabaseService.saveBusinessDocument(doc, orgId)
    );
  }

  // Audit Logs
  public static getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  public static addAuditLog(
    action: AuditLog['action'],
    module: AuditLog['module'],
    recordId: string,
    recordTitle: string,
    details: string
  ): void {
    const user = this.getUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      recordId,
      recordTitle,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200)); // Cap local cache at 200 items (UI perf only - Supabase keeps full history)
    this.syncAuditLogToSupabase(newLog);
  }

  // Notifications
  public static getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  }

  public static addNotification(notif: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>): NotificationItem {
    const notifications = this.getNotifications();
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotif;
  }

  public static markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  public static markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => ({ ...n, isRead: true }));
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  // Global Recalculation
  public static recalculateCustomerBalances(): void {
    const customers = this.getCustomers();
    const invoices = this.getInvoices();
    const payments = this.getPayments();

    const changedCustomers: Customer[] = [];

    const updated = customers.map((customer) => {
      const custInvoices = invoices.filter((i) => i.customerId === customer.id && i.status !== 'cancelled');
      const custPayments = payments.filter((p) => p.customerId === customer.id);

      const totalInvoiced = custInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
      const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

      const next = {
        ...customer,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
      };

      if (
        customer.totalInvoiced !== totalInvoiced ||
        customer.totalPaid !== totalPaid ||
        customer.totalOutstanding !== totalOutstanding
      ) {
        changedCustomers.push(next);
      }

      return next;
    });

    this.setItem(STORAGE_KEYS.CUSTOMERS, updated);
    // Push only the customers whose running balance actually changed, so
    // Supabase reflects the same up-to-date totals shown locally.
    changedCustomers.forEach((c) => this.syncCustomerToSupabase(c));
  }

  // Dashboard Stats Aggregator
  public static getDashboardStats(): DashboardStats {
    const invoices = this.getInvoices().filter((i) => i.status !== 'cancelled');
    const payments = this.getPayments();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalInvoicesCount = invoices.length;
    const totalInvoicedAmount = invoices.reduce((sum, i) => sum + i.grandTotal, 0);

    const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid' || i.status === 'sent' || i.status === 'viewed');
    const unpaidCount = unpaidInvoices.length;
    const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

    const totalOutstandingReceivables = invoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

    const monthPayments = payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthPaymentsAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthPaymentsCount = monthPayments.length;

    const monthInvoices = invoices.filter((i) => {
      const d = new Date(i.issueDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthRevenueAmount = monthInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const paidInvoicesCount = invoices.filter((i) => i.status === 'paid').length;

    return {
      totalInvoicesCount,
      totalInvoicedAmount,
      unpaidCount,
      unpaidAmount,
      overdueCount,
      overdueAmount,
      totalOutstandingReceivables,
      monthPaymentsAmount,
      monthPaymentsCount,
      monthRevenueAmount,
      paidInvoicesCount,
    };
  }

  // Aging Receivables Calculation
  public static getAgingReceivables(): AgingReceivableGroup[] {
    const invoices = this.getInvoices().filter((i) => i.outstandingAmount > 0 && i.status !== 'cancelled');
    const totalOutstanding = invoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

    let notDue = 0;
    let notDueCount = 0;
    let days1to30 = 0;
    let days1to30Count = 0;
    let days31to60 = 0;
    let days31to60Count = 0;
    let days61to90 = 0;
    let days61to90Count = 0;
    let over90 = 0;
    let over90Count = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach((inv) => {
      if (inv.dueDate >= todayStr) {
        notDue += inv.outstandingAmount;
        notDueCount++;
      } else {
        const days = getDaysOverdue(inv.dueDate);
        if (days <= 30) {
          days1to30 += inv.outstandingAmount;
          days1to30Count++;
        } else if (days <= 60) {
          days31to60 += inv.outstandingAmount;
          days31to60Count++;
        } else if (days <= 90) {
          days61to90 += inv.outstandingAmount;
          days61to90Count++;
        } else {
          over90 += inv.outstandingAmount;
          over90Count++;
        }
      }
    });

    const calcPct = (amount: number) => (totalOutstanding > 0 ? (amount / totalOutstanding) * 100 : 0);

    return [
      { range: 'Belum Jatuh Tempo', amount: notDue, count: notDueCount, percentage: calcPct(notDue) },
      { range: '1 - 30 Hari', amount: days1to30, count: days1to30Count, percentage: calcPct(days1to30) },
      { range: '31 - 60 Hari', amount: days31to60, count: days31to60Count, percentage: calcPct(days31to60) },
      { range: '61 - 90 Hari', amount: days61to90, count: days61to90Count, percentage: calcPct(days61to90) },
      { range: '> 90 Hari', amount: over90, count: over90Count, percentage: calcPct(over90) },
    ];
  }

  // ==========================================
  // BANK RECONCILIATION METHODS
  // ==========================================

  public static getBankConnections(): BankFeedConnection[] {
    return this.getItem<BankFeedConnection[]>(STORAGE_KEYS.BANK_CONNECTIONS, initialBankConnections);
  }

  public static saveBankConnections(conns: BankFeedConnection[]): void {
    this.setItem(STORAGE_KEYS.BANK_CONNECTIONS, conns);
  }

  public static getBankTransactions(): BankTransaction[] {
    return this.getItem<BankTransaction[]>(STORAGE_KEYS.BANK_TRANSACTIONS, initialBankTransactions);
  }

  public static saveBankTransactions(txs: BankTransaction[]): void {
    this.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, txs);
    // NOTE: Cloud sync intentionally not implemented yet - Bank
    // Reconciliation is deprioritized for now. It also needs a schema
    // decision first: src/types/database.ts already defines a
    // `bank_transactions` table shape (date, type:'credit'|'debit',
    // is_reconciled, reconciled_with_type/id/number) that's DIFFERENT from
    // the richer local `BankTransaction` interface actually used by the UI
    // (transactionDate, status:'unmatched'|'matched'|'reconciled'|'ignored',
    // matchedPaymentId, matchedInvoiceId, bankAccountId, matchReason,
    // notes...). Neither has been created via a migration yet. Whichever
    // shape is picked, the SQL migration + SupabaseService methods need to
    // match it exactly before wiring this back up.
  }

  public static addBankTransaction(tx: Omit<BankTransaction, 'id'>): BankTransaction {
    const txs = this.getBankTransactions();
    const newTx: BankTransaction = {
      ...tx,
      id: generateId(),
    };
    txs.unshift(newTx);
    this.saveBankTransactions(txs);
    return newTx;
  }

  public static updateBankTransaction(id: string, partial: Partial<BankTransaction>): BankTransaction | undefined {
    const txs = this.getBankTransactions();
    const index = txs.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    txs[index] = { ...txs[index], ...partial };
    this.saveBankTransactions(txs);
    return txs[index];
  }

  public static deleteBankTransaction(id: string): boolean {
    const txs = this.getBankTransactions();
    const filtered = txs.filter((t) => t.id !== id);
    if (filtered.length === txs.length) return false;
    this.saveBankTransactions(filtered);
    // Cloud delete intentionally not wired yet either - see note above.
    // SupabaseService.deleteBankTransaction(id).catch((e) =>
    //   console.error('Gagal menghapus transaksi bank di Supabase:', e)
    // );
    return true;
  }

  public static ignoreBankTransaction(id: string, notes?: string): BankTransaction | undefined {
    return this.updateBankTransaction(id, {
      status: 'ignored',
      notes: notes || 'Ditandai abaikan / transaksi non-tagihan',
    });
  }

  public static unmatchBankTransaction(id: string): BankTransaction | undefined {
    return this.updateBankTransaction(id, {
      status: 'unmatched',
      matchedInvoiceId: undefined,
      matchedInvoiceNumber: undefined,
      matchedCustomerName: undefined,
      matchConfidence: 0,
      matchReason: undefined,
    });
  }

  /**
   * Intelligently scans unmatched/matched transactions and pairs them with open invoices or payments.
   */
  public static autoMatchTransactions(): { matchedCount: number; updatedTransactions: BankTransaction[] } {
    const txs = this.getBankTransactions();
    const invoices = this.getInvoices();
    const payments = this.getPayments();
    let matchedCount = 0;

    const updated = txs.map((tx) => {
      // If already reconciled, keep as is
      if (tx.status === 'reconciled') return tx;

      // If DB (debit / outflow), default to ignored or fee
      if (tx.type === 'DB') {
        return {
          ...tx,
          status: 'ignored' as const,
          matchConfidence: 0,
          matchReason: 'Pengeluaran bank / Biaya administrasi (Non-penerimaan tagihan)',
        };
      }

      const desc = (tx.description || '').toUpperCase();
      const ref = (tx.referenceNumber || '').toUpperCase();
      const amount = tx.amount;

      // 1. Check if matches an existing verified payment first
      const matchedExistingPayment = payments.find((p) => {
        if (p.amount === amount) {
          const inv = invoices.find((i) => i.id === p.invoiceId);
          if (inv && (desc.includes(inv.invoiceNumber.toUpperCase()) || desc.includes(p.receiptNumber.toUpperCase()))) {
            return true;
          }
          if (desc.includes(p.customerName.toUpperCase())) return true;
        }
        return false;
      });

      if (matchedExistingPayment) {
        return {
          ...tx,
          status: 'reconciled' as const,
          matchedPaymentId: matchedExistingPayment.id,
          matchedInvoiceId: matchedExistingPayment.invoiceId,
          matchedInvoiceNumber: matchedExistingPayment.invoiceNumber,
          matchedCustomerName: matchedExistingPayment.customerName,
          matchConfidence: 100,
          matchReason: `Cocok dengan Kuitansi ${matchedExistingPayment.receiptNumber} (${matchedExistingPayment.customerName})`,
          reconciledAt: matchedExistingPayment.createdAt,
        };
      }

      // 2. Search candidate open invoices (outstanding > 0)
      const openInvoices = invoices.filter((i) => i.outstandingAmount > 0 && i.status !== 'cancelled');

      let bestMatch: {
        invoice: Invoice;
        score: number;
        reason: string;
      } | null = null;

      for (const inv of openInvoices) {
        let score = 0;
        const reasons: string[] = [];

        // Check invoice number match (exact, partial, stripped)
        const cleanInvNum = inv.invoiceNumber.replace(/\//g, '').toUpperCase();
        const shortNum = inv.invoiceNumber.split('/').pop() || '';
        const hasExactInvNumber =
          desc.includes(inv.invoiceNumber.toUpperCase()) ||
          desc.includes(cleanInvNum) ||
          ref.includes(inv.invoiceNumber.toUpperCase()) ||
          (shortNum.length >= 4 && desc.includes(shortNum));

        if (hasExactInvNumber) {
          score += 60;
          reasons.push(`No. Invoice ditemukan (${inv.invoiceNumber})`);
        }

        // Check amount match
        if (amount === inv.outstandingAmount) {
          score += 35;
          reasons.push(`Nominal persis sisa tagihan (${amount.toLocaleString('id-ID')})`);
        } else if (amount === inv.grandTotal) {
          score += 30;
          reasons.push(`Nominal persis total tagihan (${amount.toLocaleString('id-ID')})`);
        } else if (amount <= inv.outstandingAmount) {
          score += 15;
          reasons.push(`Nominal cicilan valid (<= ${inv.outstandingAmount.toLocaleString('id-ID')})`);
        }

        // Check customer company name / name match
        const custName = (inv.customerName || '').toUpperCase();
        const custComp = (inv.customerCompanyName || '').toUpperCase();
        const keywords = [
          ...custName.split(' ').filter((w) => w.length > 3 && !['CV', 'PT', 'TBK', 'PERSERO', 'GRUP'].includes(w)),
          ...custComp.split(' ').filter((w) => w.length > 3 && !['CV', 'PT', 'TBK', 'PERSERO', 'GRUP'].includes(w)),
        ];

        const matchedKeyword = keywords.find((k) => desc.includes(k) || ref.includes(k));
        if (matchedKeyword) {
          score += 20;
          reasons.push(`Nama klien cocok (${inv.customerName})`);
        }

        if (score > (bestMatch?.score || 0)) {
          bestMatch = {
            invoice: inv,
            score: Math.min(100, score),
            reason: reasons.join(' + '),
          };
        }
      }

      if (bestMatch && bestMatch.score >= 50) {
        matchedCount++;
        return {
          ...tx,
          status: 'matched' as const,
          matchedInvoiceId: bestMatch.invoice.id,
          matchedInvoiceNumber: bestMatch.invoice.invoiceNumber,
          matchedCustomerName: bestMatch.invoice.customerName,
          matchConfidence: bestMatch.score,
          matchReason: bestMatch.reason,
        };
      }

      // No match found
      return {
        ...tx,
        status: 'unmatched' as const,
        matchedInvoiceId: undefined,
        matchedInvoiceNumber: undefined,
        matchedCustomerName: undefined,
        matchConfidence: bestMatch ? bestMatch.score : 0,
        matchReason: 'Belum ditemukan invoice atau pembayaran yang cocok',
      };
    });

    this.saveBankTransactions(updated);
    return { matchedCount, updatedTransactions: updated };
  }

  /**
   * Reconciles a bank transaction with an invoice (or existing payment)
   * Automatically generates payment receipt, updates invoice balance, logs audit, and marks transaction as reconciled.
   */
  public static async reconcileTransaction(
    txId: string,
    invoiceId?: string,
    paymentId?: string,
    customAmount?: number
  ): Promise<{ success: boolean; payment?: Payment; message: string }> {
    const txs = this.getBankTransactions();
    const txIndex = txs.findIndex((t) => t.id === txId);
    if (txIndex === -1) throw new Error('Transaksi bank tidak ditemukan');

    const tx = txs[txIndex];
    const user = this.getUser();

    // 1. If matching to an existing payment
    if (paymentId) {
      const payment = this.getPayments().find((p) => p.id === paymentId);
      if (!payment) throw new Error('Pembayaran tidak ditemukan');

      tx.status = 'reconciled';
      tx.matchedPaymentId = payment.id;
      tx.matchedInvoiceId = payment.invoiceId;
      tx.matchedInvoiceNumber = payment.invoiceNumber;
      tx.matchedCustomerName = payment.customerName;
      tx.matchConfidence = 100;
      tx.matchReason = `Terhubung manual dengan Kuitansi ${payment.receiptNumber}`;
      tx.reconciledAt = new Date().toISOString();
      tx.reconciledBy = user.name;

      txs[txIndex] = tx;
      this.saveBankTransactions(txs);

      this.addAuditLog(
        'reconcile',
        'reconciliation',
        tx.id,
        tx.referenceNumber || tx.id,
        `Rekonsiliasi mutasi bank ${tx.bankName} Rp${tx.amount.toLocaleString('id-ID')} dengan Kuitansi ${payment.receiptNumber}`
      );

      return {
        success: true,
        payment,
        message: `Berhasil mencocokkan dengan kuitansi ${payment.receiptNumber}`,
      };
    }

    // 2. If matching to an open invoice (creates new payment receipt automatically!)
    const targetInvoiceId = invoiceId || tx.matchedInvoiceId;
    if (!targetInvoiceId) {
      throw new Error('Pilih invoice tujuan untuk merekonsiliasi transaksi ini');
    }

    const invoice = this.getInvoiceById(targetInvoiceId);
    if (!invoice) throw new Error('Invoice tidak ditemukan');

    const payAmount = customAmount !== undefined ? customAmount : Math.min(tx.amount, invoice.outstandingAmount);
    if (payAmount <= 0) {
      throw new Error('Nominal rekonsiliasi harus lebih dari 0');
    }

    // Record the payment
    const newPayment = await this.recordPayment({
      invoiceId: invoice.id,
      amount: payAmount,
      paymentDate: tx.transactionDate || new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      destinationBank: tx.bankName,
      bankAccountId: tx.bankAccountId,
      accountNumber: tx.accountNumber,
      referenceNumber: tx.referenceNumber,
      notes: `Otomatis direkonsiliasi dari Mutasi Bank (${tx.bankName} - Ref: ${tx.referenceNumber || '-'}). Ket: ${tx.description}`,
    });

    // Update bank transaction
    tx.status = 'reconciled';
    tx.matchedPaymentId = newPayment.id;
    tx.matchedInvoiceId = invoice.id;
    tx.matchedInvoiceNumber = invoice.invoiceNumber;
    tx.matchedCustomerName = invoice.customerName;
    tx.matchConfidence = 100;
    tx.matchReason = `Terverifikasi otomatis menjadi Kuitansi ${newPayment.receiptNumber}`;
    tx.reconciledAt = new Date().toISOString();
    tx.reconciledBy = user.name;

    txs[txIndex] = tx;
    this.saveBankTransactions(txs);

    this.addAuditLog(
      'reconcile',
      'reconciliation',
      tx.id,
      tx.referenceNumber || tx.id,
      `Rekonsiliasi otomatis: Mutasi bank ${tx.bankName} Rp${tx.amount.toLocaleString('id-ID')} diterbitkan Kuitansi ${newPayment.receiptNumber} untuk ${invoice.invoiceNumber}`
    );

    this.addNotification({
      title: 'Rekonsiliasi Bank Berhasil',
      message: `Mutasi bank Rp${tx.amount.toLocaleString('id-ID')} berhasil diverifikasi untuk ${invoice.invoiceNumber} (${invoice.customerName}).`,
      type: 'success',
      linkModule: 'payments',
      linkId: newPayment.id,
    });

    return {
      success: true,
      payment: newPayment,
      message: `Berhasil menerbitkan kuitansi ${newPayment.receiptNumber} dan memperbarui status tagihan ${invoice.invoiceNumber}`,
    };
  }

  /**
   * One-click Batch Auto-Reconcile for all transactions with high confidence (>= minConfidence)
   */
  public static async autoReconcileAllMatched(minConfidence = 85): Promise<{
    reconciledCount: number;
    totalAmountReconciled: number;
    newPayments: Payment[];
  }> {
    // First refresh matches
    this.autoMatchTransactions();
    const txs = this.getBankTransactions();
    const candidates = txs.filter(
      (t) => t.status === 'matched' && (t.matchConfidence || 0) >= minConfidence && t.matchedInvoiceId
    );

    let reconciledCount = 0;
    let totalAmountReconciled = 0;
    const newPayments: Payment[] = [];

    for (const tx of candidates) {
      try {
        const res = await this.reconcileTransaction(tx.id, tx.matchedInvoiceId);
        if (res.success && res.payment) {
          reconciledCount++;
          totalAmountReconciled += tx.amount;
          newPayments.push(res.payment);
        }
      } catch (e) {
        console.error(`Failed to auto reconcile tx ${tx.id}:`, e);
      }
    }

    return {
      reconciledCount,
      totalAmountReconciled,
      newPayments,
    };
  }

  /**
   * Import standard bank feed presets
   */
  public static importSampleFeedPreset(presetKey: 'bca_live' | 'mandiri_mcm' | 'bca_va' | 'qris_batch'): {
    count: number;
    transactions: BankTransaction[];
  } {
    const org = this.getOrganization();
    const today = new Date().toISOString().split('T')[0];
    let sampleRows: Array<Omit<BankTransaction, 'id'>> = [];

    if (presetKey === 'bca_live') {
      sampleRows = [
        {
          bankAccountId: 'bank-001',
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830 1928 33',
          transactionDate: today,
          description: 'TRSF E-BANKING CR 2008/FBO/INV/2026/08/00004 PT MAKMUR JAYA LOGISTIK',
          amount: 17760000,
          type: 'CR',
          referenceNumber: `BCA-${Date.now().toString().slice(-6)}`,
          status: 'unmatched',
        },
        {
          bankAccountId: 'bank-001',
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830 1928 33',
          transactionDate: today,
          description: 'TRSF CR PT TELKOM PRIMA NUSANTARA PELUNASAN KONTRAK',
          amount: 50000000,
          type: 'CR',
          referenceNumber: `BCA-${(Date.now() + 1).toString().slice(-6)}`,
          status: 'unmatched',
        },
        {
          bankAccountId: 'bank-001',
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830 1928 33',
          transactionDate: today,
          description: 'BIAYA ADM PEMELIHARAAN REK GIRO BCA BISNIS',
          amount: 25000,
          type: 'DB',
          referenceNumber: `BCA-ADM-${Date.now().toString().slice(-4)}`,
          status: 'ignored',
        },
      ];
    } else if (presetKey === 'mandiri_mcm') {
      sampleRows = [
        {
          bankAccountId: 'bank-002',
          bankName: 'Bank Mandiri',
          accountNumber: '137 00 9823 4455',
          transactionDate: today,
          description: 'TRSF MCM CR CV NUSANTARA DIGITAL KREASI RETENTION 10%',
          amount: 4500000,
          type: 'CR',
          referenceNumber: `MDR-MCM-${Date.now().toString().slice(-6)}`,
          status: 'unmatched',
        },
        {
          bankAccountId: 'bank-002',
          bankName: 'Bank Mandiri',
          accountNumber: '137 00 9823 4455',
          transactionDate: today,
          description: 'TRSF MCM CR KLINIK SEHAT UTAMA MEDIKA INV/2026/08/00005',
          amount: 27750000,
          type: 'CR',
          referenceNumber: `MDR-MCM-${(Date.now() + 2).toString().slice(-6)}`,
          status: 'unmatched',
        },
      ];
    } else if (presetKey === 'bca_va') {
      sampleRows = [
        {
          bankAccountId: 'bank-001',
          bankName: 'BCA Virtual Account',
          accountNumber: '8830 1928 0001',
          transactionDate: today,
          description: 'BCA VA 883019280001 SETTLEMENT INV/2026/08/00002 PT GLOBAL SOLUSI',
          amount: 24950000,
          type: 'CR',
          referenceNumber: `VA-BCA-${Date.now().toString().slice(-6)}`,
          status: 'unmatched',
        },
      ];
    } else {
      sampleRows = [
        {
          bankAccountId: 'bank-001',
          bankName: 'QRIS Dinamis Settlement',
          accountNumber: 'NMID 936000088192',
          transactionDate: today,
          description: 'QRIS BATCH SETTLEMENT MERCHANT PT BILLINGFLOW SOLUSI',
          amount: 8350000,
          type: 'CR',
          referenceNumber: `QRIS-${Date.now().toString().slice(-6)}`,
          status: 'unmatched',
        },
      ];
    }

    const currentTxs = this.getBankTransactions();
    const newItems: BankTransaction[] = sampleRows.map((row, idx) => ({
      ...row,
      id: `bt-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    }));

    const combined = [...newItems, ...currentTxs];
    this.saveBankTransactions(combined);
    this.autoMatchTransactions();

    return {
      count: newItems.length,
      transactions: newItems,
    };
  }

  /**
   * Import custom parsed statements from CSV or Paste text
   */
  public static importCustomStatements(
    items: Array<{
      date: string;
      description: string;
      amount: number;
      type: 'CR' | 'DB';
      ref?: string;
      bankName?: string;
      accountNumber?: string;
    }>
  ): { count: number; transactions: BankTransaction[] } {
    const org = this.getOrganization();
    const defaultBank = org.bankAccounts[0];
    const currentTxs = this.getBankTransactions();

    const newItems: BankTransaction[] = items.map((item, idx) => ({
      id: `bt-import-${Date.now()}-${idx}`,
      bankAccountId: defaultBank?.id || 'bank-001',
      bankName: item.bankName || defaultBank?.bankName || 'Bank Central Asia (BCA)',
      accountNumber: item.accountNumber || defaultBank?.accountNumber || '8830 1928 33',
      transactionDate: item.date || new Date().toISOString().split('T')[0],
      valueDate: item.date || new Date().toISOString().split('T')[0],
      description: item.description,
      amount: Math.abs(item.amount),
      type: item.type || (item.amount >= 0 ? 'CR' : 'DB'),
      referenceNumber: item.ref || `IMP-${Date.now().toString().slice(-6)}-${idx + 1}`,
      status: item.type === 'DB' ? 'ignored' : 'unmatched',
    }));

    const combined = [...newItems, ...currentTxs];
    this.saveBankTransactions(combined);
    this.autoMatchTransactions();

    return {
      count: newItems.length,
      transactions: newItems,
    };
  }

  /**
   * Summary calculation for bank reconciliation widget & dashboard
   */
  public static getReconciliationSummary(): ReconciliationSummary {
    const txs = this.getBankTransactions();
    const totalFeedTransactions = txs.length;

    let totalInflowAmount = 0;
    let totalOutflowAmount = 0;
    let reconciledCount = 0;
    let reconciledAmount = 0;
    let matchedReadyCount = 0;
    let matchedReadyAmount = 0;
    let unmatchedCount = 0;
    let unmatchedAmount = 0;
    let ignoredCount = 0;

    txs.forEach((t) => {
      if (t.type === 'CR') {
        totalInflowAmount += t.amount;
        if (t.status === 'reconciled') {
          reconciledCount++;
          reconciledAmount += t.amount;
        } else if (t.status === 'matched') {
          matchedReadyCount++;
          matchedReadyAmount += t.amount;
        } else if (t.status === 'unmatched') {
          unmatchedCount++;
          unmatchedAmount += t.amount;
        } else if (t.status === 'ignored') {
          ignoredCount++;
        }
      } else {
        totalOutflowAmount += t.amount;
        if (t.status === 'ignored') {
          ignoredCount++;
        }
      }
    });

    const inflowTxCount = txs.filter((t) => t.type === 'CR').length;
    const matchPercentage =
      inflowTxCount > 0 ? Math.round(((reconciledCount + matchedReadyCount) / inflowTxCount) * 100) : 0;

    return {
      totalFeedTransactions,
      totalInflowAmount,
      totalOutflowAmount,
      reconciledCount,
      reconciledAmount,
      matchedReadyCount,
      matchedReadyAmount,
      unmatchedCount,
      unmatchedAmount,
      ignoredCount,
      matchPercentage,
    };
  }

  // Reset to initial demo database
  public static resetToDefault() {
    localStorage.clear();
    this.setItem(STORAGE_KEYS.ORGANIZATION, initialOrganization);
    this.setItem(STORAGE_KEYS.USER, initialUser);
    this.setItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    this.setItem(STORAGE_KEYS.PRODUCTS, initialProducts);
    this.setItem(STORAGE_KEYS.INVOICES, initialInvoices);
    this.setItem(STORAGE_KEYS.PAYMENTS, initialPayments);
    this.setItem(STORAGE_KEYS.BILLING_LETTERS, initialBillingLetters);
    this.setItem(STORAGE_KEYS.DOCUMENTS, initialDocuments);
    this.setItem(STORAGE_KEYS.BUSINESS_DOCUMENTS, []);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    this.setItem(STORAGE_KEYS.SEQUENCES, initialSequences);
    this.setItem(STORAGE_KEYS.BANK_CONNECTIONS, initialBankConnections);
    this.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, initialBankTransactions);
    this.recalculateCustomerBalances();
  }
  // Phase 2C/2D: Vendor & Purchasing. Cloud mode uses one PostgreSQL transaction for
  // Purchase -> Inventory -> HPP average -> AP -> Journal. Local mode uses snapshots
  // so a failed line never leaves half-posted stock.
  public static getVendors(): any[] { return this.getItem<any[]>(STORAGE_KEYS.VENDORS, []); }
  public static async saveVendor(data:any): Promise<any> {
    const all=this.getVendors(); const now=new Date().toISOString(); let v;
    if(data.id){const i=all.findIndex((x:any)=>x.id===data.id); if(i<0) throw new Error('Vendor tidak ditemukan.'); v={...all[i],...data}; all[i]=v;}
    else{v={...data,id:generateId(),code:data.code||`VND-${String(all.length+1).padStart(4,'0')}`,isActive:data.isActive!==false,createdAt:now};all.unshift(v);}
    this.setItem(STORAGE_KEYS.VENDORS,all); this.addAuditLog(data.id?'update':'create','vendors',v.id,v.name,'Menyimpan vendor');
    const orgId=this.getSyncOrgId();
    if(orgId && isValidUUID(v.id)) this.trackedSync('vendors',v.id,v.name,()=>SupabaseService.saveVendor(v,orgId));
    return v;
  }
  public static getPurchases(): any[] { return this.getItem<any[]>(STORAGE_KEYS.PURCHASES, []); }
  public static async receivePurchase(data:any): Promise<any> {
    if(!data.vendorName?.trim()) throw new Error('Vendor wajib dipilih atau diisi.');
    if(!Array.isArray(data.items)||!data.items.length) throw new Error('Minimal satu barang pembelian.');
    if(data.items.some((i:any)=>!i.productId || Number(i.quantity)<=0 || Number(i.unitCost)<0)) throw new Error('Rincian produk, qty, dan harga pokok harus valid.');
    const purchases=this.getPurchases();
    const purchaseNumber=data.purchaseNumber||`PUR-${new Date().getFullYear()}-${String(purchases.length+1).padStart(4,'0')}`;
    const orgId=this.getSyncOrgId();
    if(orgId){
      const cloud=await SupabaseService.recordPurchaseAtomic({purchaseNumber,vendorId:(data.vendorId && isValidUUID(data.vendorId)) ? data.vendorId : undefined,vendorName:data.vendorName,purchaseDate:data.purchaseDate,dueDate:data.dueDate,notes:data.notes,items:data.items});
      if(cloud){
        const result=cloud.already_exists ? purchases.find((p:any)=>p.id===cloud.id) || cloud : {...data,id:cloud.id,purchaseNumber:cloud.purchase_number||purchaseNumber,status:'RECEIVED',paymentStatus:'UNPAID',paidAmount:0,totalAmount:Number(cloud.total_amount||data.totalAmount||0),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
        if(!result.items) result.items=data.items;
        const idx=purchases.findIndex((p:any)=>p.id===result.id); if(idx>=0)purchases[idx]=result; else purchases.unshift(result);
        this.setItem(STORAGE_KEYS.PURCHASES,purchases); this.addAuditLog('create','purchases',result.id,result.purchaseNumber,`Penerimaan atomic dari ${result.vendorName}`); return result;
      }
    }
    // Local/demo fallback: transaction-like snapshot/rollback.
    const productsBefore=JSON.stringify(this.getProducts());
    const movementsBefore=JSON.stringify(this.getInventoryMovements());
    const now=new Date().toISOString();
    const purchase={...data,id:data.id||generateId(),purchaseNumber,status:'RECEIVED',paymentStatus:'UNPAID',paidAmount:0,totalAmount:data.items.reduce((a:any,i:any)=>a+Number(i.quantity)*Number(i.unitCost),0),createdAt:data.createdAt||now,updatedAt:now};
    try{
      for(const item of purchase.items){ await this.recordInventoryReceipt({productId:item.productId,quantity:Number(item.quantity),unitCost:Number(item.unitCost),movementType:'PURCHASE',movementDate:purchase.purchaseDate,notes:`Pembelian ${purchase.purchaseNumber} dari ${purchase.vendorName}`}); }
      const existing=purchases.findIndex((x:any)=>x.id===purchase.id); if(existing>=0)purchases[existing]=purchase; else purchases.unshift(purchase);
      this.setItem(STORAGE_KEYS.PURCHASES,purchases); this.addAuditLog('create','purchases',purchase.id,purchase.purchaseNumber,`Penerimaan pembelian dari ${purchase.vendorName}`); return purchase;
    }catch(e){
      this.setItem(STORAGE_KEYS.PRODUCTS,JSON.parse(productsBefore)); this.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS,JSON.parse(movementsBefore)); throw e;
    }
  }

  public static async payPurchase(purchaseId:string, amount:number, paymentAccountId:string, paymentDate:string, referenceNumber?:string, notes?:string, idempotencyKey?:string):Promise<any>{
    if(amount<=0) throw new Error('Nominal pembayaran harus lebih dari 0.');
    if(!paymentAccountId) throw new Error('Akun kas/bank wajib dipilih.');
    if(!paymentDate) throw new Error('Tanggal pembayaran wajib diisi.');
    const purchase=this.getPurchases().find((p:any)=>p.id===purchaseId);
    if(!purchase) throw new Error('Pembelian tidak ditemukan.');
    const remaining=Math.max(0,Number(purchase.totalAmount||0)-Number(purchase.paidAmount||0));
    if(amount>remaining+0.004) throw new Error('Nominal pembayaran melebihi sisa hutang.');
    const orgId=this.getSyncOrgId();
    if(orgId){ const cloud=await SupabaseService.recordPurchasePaymentAtomic({purchaseId,amount,paymentDate,paymentAccountId,referenceNumber,notes,idempotencyKey}); if(cloud){
      const purchases=this.getPurchases(); const i=purchases.findIndex((p:any)=>p.id===purchaseId); if(i>=0){purchases[i]={...purchases[i],paidAmount:Number(cloud.paid_amount),paymentStatus:cloud.payment_status,updatedAt:new Date().toISOString()}; this.setItem(STORAGE_KEYS.PURCHASES,purchases);} return cloud;
    }}
    throw new Error('Pembayaran pembelian membutuhkan Supabase agar hutang dan jurnal tetap atomic.');
  }

}

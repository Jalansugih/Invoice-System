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
function generateId(): string {
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
  INVOICES: 'billingflow_invoices',
  PAYMENTS: 'billingflow_payments',
  BILLING_LETTERS: 'billingflow_billing_letters',
  DOCUMENTS: 'billingflow_documents',
  AUDIT_LOGS: 'billingflow_audit_logs',
  NOTIFICATIONS: 'billingflow_notifications',
  SEQUENCES: 'billingflow_sequences',
  BANK_TRANSACTIONS: 'billingflow_bank_transactions',
  BANK_CONNECTIONS: 'billingflow_bank_connections',
};

// Default organization
export const initialOrganization: Organization = {
  id: 'org-001',
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
  organizationId: 'org-001',
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
   */
  public static repairLegacyProductIds(): void {
    const products = this.getProducts();
    const idMap = new Map<string, string>();
    const fixedProducts = products.map((p) => {
      if (isValidUUID(p.id)) return p;
      const newId = generateId();
      idMap.set(p.id, newId);
      return { ...p, id: newId };
    });

    if (idMap.size === 0) return;

    this.setItem(STORAGE_KEYS.PRODUCTS, fixedProducts);

    const invoices = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    let invoicesChanged = false;
    const fixedInvoices = invoices.map((inv) => {
      if (!inv.items || inv.items.length === 0) return inv;
      let itemsChanged = false;
      const items = inv.items.map((item) => {
        if (item.productId && idMap.has(item.productId)) {
          itemsChanged = true;
          return { ...item, productId: idMap.get(item.productId) };
        }
        return item;
      });
      if (itemsChanged) {
        invoicesChanged = true;
        return { ...inv, items };
      }
      return inv;
    });
    if (invoicesChanged) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(fixedInvoices));
    }

    console.info(`Memperbaiki ${idMap.size} ID produk lama agar kompatibel dengan Supabase.`);
  }

  public static async hydrateFromSupabase(organizationId?: string | null): Promise<boolean> {
    try {
      this.repairLegacyProductIds();
      const status = await SupabaseService.checkConnection();
      if (!status.connected || !status.authenticated) {
        return false;
      }

      const orgId = organizationId || this.getSyncOrgId();
      if (!orgId) return false;

      const [customers, invoices, payments, products] = await Promise.all([
        SupabaseService.fetchCustomers(orgId),
        SupabaseService.fetchInvoices(orgId),
        SupabaseService.fetchPayments(orgId),
        SupabaseService.fetchProducts(orgId),
      ]);

      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
      // Products: only overwrite the local cache if Supabase actually
      // returned something (or we know the org genuinely has none yet).
      // An empty array here could also mean fetchProducts swallowed an
      // error internally, so we only trust it once connection+auth are
      // confirmed above.
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
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
    return org;
  }

  public static updateOrganization(org: Partial<Organization>): Organization {
    const current = this.getOrganization();
    const updated = { ...current, ...org };
    this.setItem(STORAGE_KEYS.ORGANIZATION, updated);
    this.addAuditLog('update', 'settings', updated.id, updated.name, 'Memperbarui profil dan konfigurasi organisasi');
    return updated;
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

  public static saveCustomer(customerData: Omit<Customer, 'id' | 'totalInvoiced' | 'totalPaid' | 'totalOutstanding' | 'createdAt'> & { id?: string }): Customer {
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
      const newSeq = sequences.customer + 1;
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

  public static saveProduct(productData: Omit<Product, 'id'> & { id?: string }): Product {
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
      const newSeq = sequences.product + 1;
      this.updateSequences({ product: newSeq });
      product = {
        ...productData,
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

  public static saveInvoice(invoiceData: Partial<Invoice> & { customerId: string; items: InvoiceItem[] }): Invoice {
    const invoices = this.getInvoices();
    const org = this.getOrganization();
    const customer = this.getCustomerById(invoiceData.customerId);
    const sequences = this.getSequences();

    if (!customer) throw new Error('Customer tidak valid');

    // Recalculate totals
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      invoiceData.discountType === 'percentage'
        ? (subtotal * (invoiceData.discountValue || 0)) / 100
        : invoiceData.discountValue || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = invoiceData.taxRate !== undefined ? invoiceData.taxRate : org.defaultTaxRate;
    const taxAmount = (taxableAmount * taxRate) / 100;
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
      const newSeq = sequences.invoice + 1;
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

  public static recordPayment(paymentData: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: Payment['paymentMethod'];
    destinationBank?: string;
    bankAccountId?: string;
    accountNumber?: string;
    referenceNumber?: string;
    notes?: string;
  }): Payment {
    const invoice = this.getInvoiceById(paymentData.invoiceId);
    if (!invoice) throw new Error('Invoice tidak ditemukan');

    if (paymentData.amount <= 0) throw new Error('Nominal pembayaran harus lebih dari 0');
    if (paymentData.amount > invoice.outstandingAmount) {
      throw new Error(`Nominal pembayaran melebihi sisa tagihan (${invoice.outstandingAmount})`);
    }

    const org = this.getOrganization();
    const user = this.getUser();
    const sequences = this.getSequences();

    const newPaySeq = sequences.payment + 1;
    const newReceiptSeq = sequences.receipt + 1;
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

  public static saveBillingLetter(data: {
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
  }): BillingLetter {
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
      return updated;
    }

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
    return newDoc;
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
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200)); // Cap at 200 items
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
  }

  public static addBankTransaction(tx: Omit<BankTransaction, 'id'>): BankTransaction {
    const txs = this.getBankTransactions();
    const newTx: BankTransaction = {
      ...tx,
      id: `bt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  public static reconcileTransaction(
    txId: string,
    invoiceId?: string,
    paymentId?: string,
    customAmount?: number
  ): { success: boolean; payment?: Payment; message: string } {
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
    const newPayment = this.recordPayment({
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
  public static autoReconcileAllMatched(minConfidence = 85): {
    reconciledCount: number;
    totalAmountReconciled: number;
    newPayments: Payment[];
  } {
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
        const res = this.reconcileTransaction(tx.id, tx.matchedInvoiceId);
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
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    this.setItem(STORAGE_KEYS.SEQUENCES, initialSequences);
    this.setItem(STORAGE_KEYS.BANK_CONNECTIONS, initialBankConnections);
    this.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, initialBankTransactions);
    this.recalculateCustomerBalances();
  }
}

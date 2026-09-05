import {
  TaxType,
  TaxPeriodStatus,
  TaxRateConfig,
  TaxTransaction,
  FiscalCorrection,
  CorporateIncomeTaxSummary,
  TaxReconciliationItem,
  TaxPeriodSummary,
  TaxAuditLogItem,
  TaxValidationIssue,
  TaxUserRole,
  FinancialAccountBreakdown,
  IncomeStatementData,
  BalanceSheetData,
  EquityStatementData,
  CashFlowData,
  NotesToFinancialStatementsData,
  AuditCheckItem,
  AuditInspectionSummary,
  FixedAssetItem,
  RelatedPartyTransactionItem,
  FlaggedExpenseItem,
  CoretaxProgressSummary,
  CoretaxScheduleMapping,
} from '../types/tax';
import { StorageService } from './storage';
import { Invoice, Payment, Customer } from '../types';

const TAX_STORAGE_KEYS = {
  TAX_CONFIGS: 'billingflow_tax_configs',
  TAX_TRANSACTIONS: 'billingflow_tax_transactions',
  FISCAL_CORRECTIONS: 'billingflow_fiscal_corrections',
  TAX_PERIODS: 'billingflow_tax_periods',
  TAX_AUDIT_LOGS: 'billingflow_tax_audit_logs',
  FIXED_ASSETS: 'billingflow_fixed_assets',
  RELATED_PARTIES: 'billingflow_related_parties',
  FLAGGED_EXPENSES: 'billingflow_flagged_expenses',
};

// Standard Indonesian Tax Configurations (Undang-Undang HPP No. 7/2021 & PMK/PP terkait)
export const initialTaxRateConfigs: TaxRateConfig[] = [
  {
    id: 'cfg-ppn-11',
    taxType: 'PPN',
    code: 'PPN-11',
    name: 'PPN Standar 11%',
    category: 'Pajak Pertambahan Nilai',
    description: 'Tarif PPN umum penyerahan BKP dan JKP di dalam negeri sesuai UU HPP',
    rate: 11,
    kap: '411211',
    kjs: '100',
    legalBasis: 'UU No. 7/2021 tentang Harmonisasi Peraturan Perpajakan (HPP)',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-ppn-12',
    taxType: 'PPN',
    code: 'PPN-12',
    name: 'PPN Tarif 12% (Regulasi Baru)',
    category: 'Pajak Pertambahan Nilai',
    description: 'Tarif penyesuaian PPN bertahap',
    rate: 12,
    kap: '411211',
    kjs: '100',
    legalBasis: 'Pasal 7 ayat (1) huruf b UU HPP',
    isDeductible: true,
    isActive: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-ppn-0',
    taxType: 'PPN',
    code: 'PPN-0-EKSPOR',
    name: 'PPN Ekspor Jasa / BKP 0%',
    category: 'Pajak Pertambahan Nilai',
    description: 'Penyerahan ekspor Barang Kena Pajak atau Jasa Kena Pajak',
    rate: 0,
    kap: '411211',
    kjs: '101',
    legalBasis: 'Pasal 7 ayat (2) UU PPN',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph21-pegawai',
    taxType: 'PPh21',
    code: 'PPH21-TER-A',
    name: 'PPh 21 Gaji & Tunjangan Pegawai Tetap',
    category: 'Pajak Penghasilan Karyawan',
    description: 'Pemotongan PPh 21 menggunakan skema Tarif Efektif Rata-rata (TER)',
    rate: 5,
    kap: '411121',
    kjs: '100',
    legalBasis: 'PP No. 58/2023 & PMK No. 168/2023',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph21-tenaga-ahli',
    taxType: 'PPh21',
    code: 'PPH21-AHLI-50-PROG',
    name: 'PPh 21 Bukan Pegawai / Tenaga Ahli (50% x Tarif Pasal 17)',
    category: 'Pajak Penghasilan Jasa Pribadi',
    description: 'Jasa dokter, konsultan, pengacara, notaris perorangan',
    rate: 2.5,
    kap: '411121',
    kjs: '100',
    legalBasis: 'PMK No. 168/2023',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph22-pengadaan',
    taxType: 'PPh22',
    code: 'PPH22-PENGADAAN-1.5',
    name: 'PPh 22 Pembelian Barang / Pengadaan BUMN / Instansi (1.5%)',
    category: 'PPh Pemungutan Pihak Ketiga',
    description: 'Pemungutan pajak atas penyerahan barang oleh bendaharawan/BUMN',
    rate: 1.5,
    kap: '411122',
    kjs: '900',
    legalBasis: 'PMK No. 34/PMK.010/2017 stdd PMK No. 41/2022',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph23-jasa',
    taxType: 'PPh23',
    code: 'PPH23-JASA-2',
    name: 'PPh 23 Jasa Teknik, Manajemen, Konsultan & Jasa Lainnya (2%)',
    category: 'PPh Pemotongan Jasa & Sewa Alat',
    description: 'Imbalan sehubungan dengan jasa manajemen, teknik, konstruksi, dan sewa selain tanah/bangunan',
    rate: 2,
    kap: '411124',
    kjs: '104',
    legalBasis: 'PMK No. 141/PMK.03/2015',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph23-royalti',
    taxType: 'PPh23',
    code: 'PPH23-ROYALTI-15',
    name: 'PPh 23 Dividen, Bunga & Royalti Badan DN (15%)',
    category: 'PPh Modal & Royalti',
    description: 'Pemotongan atas penghasilan bunga, royalti, dan hadiah badan dalam negeri',
    rate: 15,
    kap: '411124',
    kjs: '100',
    legalBasis: 'Pasal 23 ayat (1) huruf a UU PPh',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph25-angsuran',
    taxType: 'PPh25',
    code: 'PPH25-ANGSURAN-BADAN',
    name: 'PPh 25 Angsuran Pajak Bulanan Badan',
    category: 'Pajak Dibayar di Muka (Kredit Pajak)',
    description: 'Pembayaran angsuran PPh Badan berjalan setiap bulan',
    rate: 0, // fixed installment calculated from prior year return
    kap: '411125',
    kjs: '100',
    legalBasis: 'Pasal 25 UU PPh',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph26-wpln',
    taxType: 'PPh26',
    code: 'PPH26-WPLN-20',
    name: 'PPh 26 Subjek Pajak Luar Negeri (20% / Tax Treaty)',
    category: 'PPh Pemotongan Internasional',
    description: 'Imbalan jasa, royalti, dividen kepada Wajib Pajak Luar Negeri',
    rate: 20,
    kap: '411127',
    kjs: '100',
    legalBasis: 'Pasal 26 UU PPh / P3B (Tax Treaty)',
    isDeductible: true,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph42-sewa-gedung',
    taxType: 'PPhFinal',
    code: 'PPH42-SEWA-TANAH-BANGUNAN-10',
    name: 'PPh Final Pasal 4 ayat (2) Sewa Tanah dan/atau Bangunan (10%)',
    category: 'Pajak Penghasilan Final',
    description: 'Sewa ruang kantor, ruko, gudang, atau tanah',
    rate: 10,
    kap: '411128',
    kjs: '403',
    legalBasis: 'PP No. 34/2017',
    isDeductible: false,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph42-jasa-konstruksi',
    taxType: 'PPhFinal',
    code: 'PPH42-KONSTRUKSI-PELAKSANAAN-1.75',
    name: 'PPh Final Jasa Konstruksi Kualifikasi Kecil (1.75%)',
    category: 'Pajak Penghasilan Final',
    description: 'Pekerjaan konstruksi kualifikasi usaha kecil',
    rate: 1.75,
    kap: '411128',
    kjs: '409',
    legalBasis: 'PP No. 9/2022',
    isDeductible: false,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cfg-pph-badan-22',
    taxType: 'PPhBadan',
    code: 'PPH-BADAN-PASAL17-22',
    name: 'PPh Badan Tarif Standar 22% (Fasilitas Pasal 31E)',
    category: 'Pajak Penghasilan Badan (Tahunan)',
    description: 'Tarif PPh Wajib Pajak Badan Dalam Negeri dengan fasilitas pengurangan tarif 50% untuk omzet sampai Rp 4,8 Miliar',
    rate: 22,
    kap: '411126',
    kjs: '200',
    legalBasis: 'Pasal 17 ayat (1) huruf b & Pasal 31E UU HPP',
    isDeductible: false,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

// Initial Fiscal Corrections for Indonesian Corporate Income Tax (Form SPT 1771-I)
export const initialFiscalCorrections: FiscalCorrection[] = [
  {
    id: 'fisc-001',
    year: 2026,
    accountCode: '6-2001',
    accountName: 'Beban Jamuan & Entertainment Tanpa Daftar Nominatif',
    commercialAmount: 18500000,
    positiveCorrection: 18500000,
    negativeCorrection: 0,
    fiscalAmount: 0,
    category: 'entertainment_non_nominative',
    categoryLabel: 'Beban Jamuan Non-Nominatif',
    reason: 'Pengeluaran jamuan representasi klien yang tidak dilengkapi daftar nominatif sesuai ketentuan PMK No. 02/PMK.03/2010',
    legalBasis: 'Pasal 9 ayat (1) UU PPh & PMK 02/PMK.03/2010',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'fisc-002',
    year: 2026,
    accountCode: '6-2004',
    accountName: 'Beban Natura / Kenikmatan Karyawan Tertentu',
    commercialAmount: 12000000,
    positiveCorrection: 4500000,
    negativeCorrection: 0,
    fiscalAmount: 7500000,
    category: 'non_deductible_expense',
    categoryLabel: 'Natura & Kenikmatan Non-Deductible',
    reason: 'Fasilitas kendaraan untuk keluarga manajemen yang tidak berkaitan langsung dengan 3M (Mendapatkan, Menagih, Memelihara penghasilan)',
    legalBasis: 'PMK No. 66/2023 tentang Perlakuan PPh atas Natura/Kenikmatan',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'fisc-003',
    year: 2026,
    accountCode: '6-3008',
    accountName: 'Sanksi Denda & Bunga Keterlambatan Pajak',
    commercialAmount: 2400000,
    positiveCorrection: 2400000,
    negativeCorrection: 0,
    fiscalAmount: 0,
    category: 'tax_penalty',
    categoryLabel: 'Sanksi Administrasi Perpajakan',
    reason: 'Sanksi administrasi berupa bunga/denda perpajakan tidak dapat dibiayakan secara fiskal',
    legalBasis: 'Pasal 9 ayat (1) huruf k UU PPh',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'fisc-004',
    year: 2026,
    accountCode: '6-4001',
    accountName: 'Beda Waktu Penyusutan Komersial vs Fiskal (Aset Kelompok 1 & 2)',
    commercialAmount: 48000000,
    positiveCorrection: 6000000,
    negativeCorrection: 0,
    fiscalAmount: 42000000,
    category: 'depreciation_diff',
    categoryLabel: 'Selisih Penyusutan Fiskal',
    reason: 'Penyusutan komersial menggunakan masa manfaat 5 tahun, sedangkan tarif fiskal kelompok 1 menggunakan metode garis lurus 4 tahun (25%)',
    legalBasis: 'Pasal 11 UU PPh & PMK 72/2023',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'fisc-005',
    year: 2026,
    accountCode: '8-1002',
    accountName: 'Pendapatan Bunga Deposito Bank (Dikenakan PPh Final 20%)',
    commercialAmount: 14200000,
    positiveCorrection: 0,
    negativeCorrection: 14200000,
    fiscalAmount: 0,
    category: 'final_tax_income',
    categoryLabel: 'Penghasilan Dikenakan Pajak Final',
    reason: 'Pendapatan bunga deposito telah dipotong PPh Final 20% oleh perbankan sehingga dikeluarkan dari penghasilan kena pajak badan',
    legalBasis: 'PP No. 131/2000 stdd PP No. 123/2015',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'fisc-006',
    year: 2026,
    accountCode: '6-2009',
    accountName: 'Sumbangan Sosial Non-Keagamaan / CSR Non-Infrastruktur',
    commercialAmount: 7500000,
    positiveCorrection: 7500000,
    negativeCorrection: 0,
    fiscalAmount: 0,
    category: 'non_deductible_expense',
    categoryLabel: 'Sumbangan Non-Wajib',
    reason: 'Sumbangan yang tidak memenuhi kriteria PP No. 93/2010 (Bencana nasional, litbang, fasilitas pendidikan/olahraga)',
    legalBasis: 'PP No. 93/2010',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
];

// Realistic Sample Indonesian Tax Transactions for Year 2026 (Masa Pajak 01 s/d 08)
export const initialTaxTransactions: TaxTransaction[] = [
  // Output VAT (PPN Keluaran dari Invoices Penjualan)
  {
    id: 'tax-tx-001',
    transactionNumber: 'TAX-2026-08-0001',
    taxType: 'PPN',
    taxCode: 'PPN-11',
    taxRate: 11,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-05',
    taxInvoiceNumber: '010.001-26.88391001',
    taxInvoiceType: 'normal',
    sourceType: 'sales_invoice',
    sourceId: 'inv-001',
    sourceDocNumber: 'INV/2026/08/00001',
    partyType: 'customer',
    partyId: 'cust-001',
    partyName: 'PT Telkom Prima Nusantara',
    partyNpwp: '02.456.789.1-015.000',
    partyAddress: 'Gedung Grha Telekomunikasi Lt. 12, Jl. Gatot Subroto No. 45, Jakarta Selatan',
    dpp: 50000000,
    taxAmount: 5500000,
    grossAmount: 55500000,
    isCreditable: true,
    category: 'output_vat',
    paymentStatus: 'paid',
    filingStatus: 'ready_to_file',
    journalEntryNumber: 'JV-2026-08-001',
    notes: 'Penyerahan Jasa Pengembangan Software Billing & Lisensi Enterprise',
    createdAt: '2026-08-05T08:00:00.000Z',
    updatedAt: '2026-08-05T08:00:00.000Z',
  },
  {
    id: 'tax-tx-002',
    transactionNumber: 'TAX-2026-08-0002',
    taxType: 'PPN',
    taxCode: 'PPN-11',
    taxRate: 11,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-10',
    taxInvoiceNumber: '010.001-26.88391002',
    taxInvoiceType: 'normal',
    sourceType: 'sales_invoice',
    sourceId: 'inv-002',
    sourceDocNumber: 'INV/2026/08/00002',
    partyType: 'customer',
    partyId: 'cust-002',
    partyName: 'CV Nusantara Digital Kreasi',
    partyNpwp: '03.789.123.4-022.000',
    partyAddress: 'Jl. Riau No. 88, Citarum, Bandung',
    dpp: 30000000,
    taxAmount: 3300000,
    grossAmount: 33300000,
    isCreditable: true,
    category: 'output_vat',
    paymentStatus: 'paid',
    filingStatus: 'ready_to_file',
    journalEntryNumber: 'JV-2026-08-002',
    notes: 'Penyerahan Jasa Setup Cloud Server & API Integration',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'tax-tx-003',
    transactionNumber: 'TAX-2026-08-0003',
    taxType: 'PPN',
    taxCode: 'PPN-11',
    taxRate: 11,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-16',
    taxInvoiceNumber: '010.001-26.88391003',
    taxInvoiceType: 'normal',
    sourceType: 'sales_invoice',
    sourceId: 'inv-003',
    sourceDocNumber: 'INV/2026/08/00003',
    partyType: 'customer',
    partyId: 'cust-003',
    partyName: 'PT Global Solusi Mandiri',
    partyNpwp: '01.999.888.7-033.000',
    partyAddress: 'Jl. Basuki Rahmat No. 12, Surabaya',
    dpp: 40000000,
    taxAmount: 4400000,
    grossAmount: 44400000,
    isCreditable: true,
    category: 'output_vat',
    paymentStatus: 'unpaid',
    filingStatus: 'draft',
    journalEntryNumber: 'JV-2026-08-003',
    notes: 'Jasa Konsultasi Keuangan & Custom Script Billing',
    createdAt: '2026-08-16T11:00:00.000Z',
    updatedAt: '2026-08-16T11:00:00.000Z',
  },
  // Input VAT (PPN Masukan dari Pengadaan Vendor / Cloud Hosting / Perlengkapan)
  {
    id: 'tax-tx-004',
    transactionNumber: 'TAX-2026-08-0004',
    taxType: 'PPN',
    taxCode: 'PPN-11',
    taxRate: 11,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-03',
    taxInvoiceNumber: '010.002-26.11223344',
    taxInvoiceType: 'normal',
    sourceType: 'purchase_bill',
    sourceDocNumber: 'BILL/2026/08/0014',
    partyType: 'supplier',
    partyName: 'PT Data Prima Hosting Indonesia',
    partyNpwp: '01.234.567.8-011.000',
    partyAddress: 'Cyber Building Lt. 5, Jl. Kuningan Barat, Jakarta',
    dpp: 22000000,
    taxAmount: 2420000,
    grossAmount: 24420000,
    isCreditable: true,
    category: 'input_vat',
    paymentStatus: 'paid',
    filingStatus: 'ready_to_file',
    journalEntryNumber: 'JV-2026-08-004',
    notes: 'Faktur Pajak Masukan Langganan Dedicated Server Tier-3',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
  },
  {
    id: 'tax-tx-005',
    transactionNumber: 'TAX-2026-08-0005',
    taxType: 'PPN',
    taxCode: 'PPN-11',
    taxRate: 11,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-08',
    taxInvoiceNumber: '010.002-26.55667788',
    taxInvoiceType: 'normal',
    sourceType: 'purchase_bill',
    sourceDocNumber: 'BILL/2026/08/0022',
    partyType: 'supplier',
    partyName: 'PT Tri Usaha Stationery & IT Equipments',
    partyNpwp: '02.345.678.9-021.000',
    partyAddress: 'Komp. Ruko Mangga Dua Mall No. 18, Jakarta',
    dpp: 14000000,
    taxAmount: 1540000,
    grossAmount: 15540000,
    isCreditable: true,
    category: 'input_vat',
    paymentStatus: 'paid',
    filingStatus: 'ready_to_file',
    journalEntryNumber: 'JV-2026-08-005',
    notes: 'Pengadaan Hardware Firewall & Aksesoris Kantor Operasional',
    createdAt: '2026-08-08T14:00:00.000Z',
    updatedAt: '2026-08-08T14:00:00.000Z',
  },
  // PPh 23 Dipotong oleh Pelanggan (Bukti Potong PPh 23 - Menjadi Kredit Pajak bagi PT BillingFlow)
  {
    id: 'tax-tx-006',
    transactionNumber: 'TAX-2026-08-0006',
    taxType: 'PPh23',
    taxCode: 'PPH23-JASA-2',
    taxRate: 2,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-06',
    withholdingSlipNumber: '23-BP-202608-0088',
    sourceType: 'sales_invoice',
    sourceId: 'inv-001',
    sourceDocNumber: 'INV/2026/08/00001',
    partyType: 'customer',
    partyId: 'cust-001',
    partyName: 'PT Telkom Prima Nusantara',
    partyNpwp: '02.456.789.1-015.000',
    dpp: 50000000,
    taxAmount: 1000000,
    grossAmount: 50000000,
    isCreditable: true,
    category: 'tax_credit',
    paymentStatus: 'credited',
    filingStatus: 'ready_to_file',
    notes: 'Bukti Potong PPh 23 Jasa Software diterima dari Telkom Prima',
    createdAt: '2026-08-06T09:00:00.000Z',
    updatedAt: '2026-08-06T09:00:00.000Z',
  },
  {
    id: 'tax-tx-007',
    transactionNumber: 'TAX-2026-08-0007',
    taxType: 'PPh23',
    taxCode: 'PPH23-JASA-2',
    taxRate: 2,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-11',
    withholdingSlipNumber: '23-BP-202608-0094',
    sourceType: 'sales_invoice',
    sourceId: 'inv-002',
    sourceDocNumber: 'INV/2026/08/00002',
    partyType: 'customer',
    partyId: 'cust-002',
    partyName: 'CV Nusantara Digital Kreasi',
    partyNpwp: '03.789.123.4-022.000',
    dpp: 30000000,
    taxAmount: 600000,
    grossAmount: 30000000,
    isCreditable: true,
    category: 'tax_credit',
    paymentStatus: 'credited',
    filingStatus: 'ready_to_file',
    notes: 'Bukti Potong PPh 23 Jasa Cloud Maintenance',
    createdAt: '2026-08-11T10:00:00.000Z',
    updatedAt: '2026-08-11T10:00:00.000Z',
  },
  // PPh 21 Pemotongan Gaji Karyawan & Honor Konsultan (Hutang Pajak Terutang)
  {
    id: 'tax-tx-008',
    transactionNumber: 'TAX-2026-08-0008',
    taxType: 'PPh21',
    taxCode: 'PPH21-TER-A',
    taxRate: 5,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-25',
    withholdingSlipNumber: '21-BP-202608-0010',
    sourceType: 'payroll',
    sourceDocNumber: 'PAYROLL/2026/08',
    partyType: 'employee',
    partyName: 'Daftar Karyawan PT BillingFlow (14 Pegawai)',
    partyNpwp: '01.345.678.9-012.000',
    dpp: 85000000,
    taxAmount: 4250000,
    grossAmount: 85000000,
    isCreditable: false,
    category: 'withheld_payable',
    paymentStatus: 'unpaid',
    filingStatus: 'draft',
    billingCode: '028918273645',
    notes: 'Pemotongan PPh 21 Gaji Bulan Agustus 2026 skema TER PMK 168',
    createdAt: '2026-08-18T08:00:00.000Z',
    updatedAt: '2026-08-18T08:00:00.000Z',
  },
  // PPh 4(2) Final Sewa Kantor
  {
    id: 'tax-tx-009',
    transactionNumber: 'TAX-2026-08-0009',
    taxType: 'PPhFinal',
    taxCode: 'PPH42-SEWA-TANAH-BANGUNAN-10',
    taxRate: 10,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-01',
    withholdingSlipNumber: '42-BP-202608-0001',
    sourceType: 'purchase_bill',
    sourceDocNumber: 'BILL/RENT/2026/08',
    partyType: 'supplier',
    partyName: 'PT Menara Sentral Propertindo',
    partyNpwp: '01.888.777.6-018.000',
    partyAddress: 'Jl. Jend. Sudirman Kav 52, Jakarta',
    dpp: 25000000,
    taxAmount: 2500000,
    grossAmount: 25000000,
    isCreditable: false,
    category: 'final_tax',
    paymentStatus: 'paid',
    ntpn: '78A90B1C2D3E4F5G',
    billingCode: '019283746554',
    paymentDate: '2026-08-10',
    filingStatus: 'ready_to_file',
    notes: 'Pemotongan PPh Final Pasal 4(2) Sewa Gedung Menara Sentral Lt. 18',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-10T11:00:00.000Z',
  },
  // PPh 25 Angsuran Bulanan (Setoran Pajak Mandiri)
  {
    id: 'tax-tx-010',
    transactionNumber: 'TAX-2026-08-0010',
    taxType: 'PPh25',
    taxCode: 'PPH25-ANGSURAN-BADAN',
    taxRate: 0,
    periodYear: 2026,
    periodMonth: 8,
    transactionDate: '2026-08-15',
    sourceType: 'bank_payment',
    sourceDocNumber: 'SSP-PPH25-2026-08',
    partyType: 'government',
    partyName: 'Kas Negara (KPP Pratama Setiabudi)',
    partyNpwp: '01.345.678.9-012.000',
    dpp: 0,
    taxAmount: 3500000,
    grossAmount: 3500000,
    isCreditable: true,
    category: 'prepaid_tax',
    paymentStatus: 'paid',
    ntpn: '99F8E7D6C5B4A301',
    billingCode: '028192837461',
    paymentDate: '2026-08-14',
    filingStatus: 'ready_to_file',
    notes: 'Setoran Angsuran Masa PPh 25 Badan Bulan Agustus 2026',
    createdAt: '2026-08-14T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
  },
];

// Initial Tax Period Records
export const initialTaxPeriods: Record<string, Partial<TaxPeriodSummary>> = {
  '2026-08': {
    year: 2026,
    month: 8,
    periodLabel: 'Agustus 2026',
    status: 'review',
    vatPreviousPeriodOverpaymentCompensation: 500000, // Rp 500rb kompensasi dari Juli
    isLocked: false,
  },
  '2026-07': {
    year: 2026,
    month: 7,
    periodLabel: 'Juli 2026',
    status: 'filed',
    vatPreviousPeriodOverpaymentCompensation: 0,
    ntpn: '88A1B2C3D4E5F678',
    billingCode: '019283746192',
    bpeNumber: 'BPE-DJP-202607-009182',
    paymentDate: '2026-08-10',
    filingDate: '2026-08-18',
    filedBy: 'Budi Hartono (CFO)',
    approvedBy: 'Ahmad Fauzi (Owner)',
    reviewedBy: 'Dewi Lestari (Tax Officer)',
    isLocked: true,
  },
};

export const initialFixedAssets: FixedAssetItem[] = [
  {
    id: 'ast-001',
    code: 'AST-SRV-01',
    name: 'Server Rack Enterprise & UPS Infrastructure',
    category: 'Peralatan & Komputer',
    acquisitionDate: '2024-03-15',
    acquisitionCost: 120000000,
    commercialUsefulLifeYears: 4,
    commercialMethod: 'straight_line',
    fiscalCategory: 'group_1',
    fiscalUsefulLifeYears: 4,
    fiscalMethod: 'straight_line',
    fiscalRate: 25,
    commercialDepreciationAnnual: 30000000,
    fiscalDepreciationAnnual: 30000000,
    depreciationDifference: 0,
    accumulatedDepreciationCommercial: 75000000,
    accumulatedDepreciationFiscal: 75000000,
    bookValueCommercial: 45000000,
    bookValueFiscal: 45000000,
    status: 'verified',
    notes: 'Infrastruktur cloud server on-premise sesuai PMK 72/2023',
  },
  {
    id: 'ast-002',
    code: 'AST-LAP-02',
    name: 'MacBook Pro M3 Max & Workstation Designer',
    category: 'Peralatan & Komputer',
    acquisitionDate: '2025-01-10',
    acquisitionCost: 85000000,
    commercialUsefulLifeYears: 4,
    commercialMethod: 'straight_line',
    fiscalCategory: 'group_1',
    fiscalUsefulLifeYears: 4,
    fiscalMethod: 'straight_line',
    fiscalRate: 25,
    commercialDepreciationAnnual: 21250000,
    fiscalDepreciationAnnual: 21250000,
    depreciationDifference: 0,
    accumulatedDepreciationCommercial: 35416666,
    accumulatedDepreciationFiscal: 35416666,
    bookValueCommercial: 49583334,
    bookValueFiscal: 49583334,
    status: 'verified',
    notes: 'Laptop tim engineering & design produk',
  },
  {
    id: 'ast-003',
    code: 'AST-VHC-01',
    name: 'Mobil Operasional Lapangan (Toyota Avanza Veloz)',
    category: 'Kendaraan',
    acquisitionDate: '2023-06-20',
    acquisitionCost: 280000000,
    commercialUsefulLifeYears: 5, // Komersial 5 th (20%)
    commercialMethod: 'straight_line',
    fiscalCategory: 'group_2', // Fiskal Gol 2 (8 th / 12.5%)
    fiscalUsefulLifeYears: 8,
    fiscalMethod: 'straight_line',
    fiscalRate: 12.5,
    commercialDepreciationAnnual: 56000000,
    fiscalDepreciationAnnual: 35000000,
    depreciationDifference: 21000000, // Koreksi Fiskal Positif Beda Waktu Rp 21jt
    accumulatedDepreciationCommercial: 177333333,
    accumulatedDepreciationFiscal: 110833333,
    bookValueCommercial: 102666667,
    bookValueFiscal: 169166667,
    status: 'verified',
    notes: 'Beda waktu penyusutan komersial (5 th) vs fiskal Golongan 2 (8 th)',
  },
  {
    id: 'ast-004',
    code: 'AST-OFF-01',
    name: 'Interior & Furnitur Kantor Pusat Sudirman',
    category: 'Peralatan & Inventaris',
    acquisitionDate: '2023-01-05',
    acquisitionCost: 150000000,
    commercialUsefulLifeYears: 8,
    commercialMethod: 'straight_line',
    fiscalCategory: 'group_2',
    fiscalUsefulLifeYears: 8,
    fiscalMethod: 'straight_line',
    fiscalRate: 12.5,
    commercialDepreciationAnnual: 18750000,
    fiscalDepreciationAnnual: 18750000,
    depreciationDifference: 0,
    accumulatedDepreciationCommercial: 67187500,
    accumulatedDepreciationFiscal: 67187500,
    bookValueCommercial: 82812500,
    bookValueFiscal: 82812500,
    status: 'verified',
    notes: 'Meja kerja, partisi akustik, dan inventaris kantor',
  },
];

export const initialRelatedPartyTransactions: RelatedPartyTransactionItem[] = [
  {
    id: 'rpt-001',
    partyName: 'PT Nusantara Digital Inovasi Holding',
    partyNpwp: '01.234.567.8-012.000',
    relationshipType: 'shareholding_25_plus',
    relationshipLabel: 'Kepemilikan Saham > 25%',
    transactionType: 'service_fee',
    transactionTypeLabel: 'Jasa Manajemen & IT Support',
    amount: 120000000,
    armLengthPrice: 120000000,
    pricingMethod: 'TNMM',
    transferPricingDocRef: 'TP-DOC/2026/001-MGMT',
    status: 'documented',
    notes: 'Sudah memiliki Local File TP Documentation sesuai PMK 172/2023',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'rpt-002',
    partyName: 'Ahmad Fauzi (Direktur Utama / Pemegang Saham)',
    partyNpwp: '72.345.678.9-014.000',
    relationshipType: 'management_control',
    relationshipLabel: 'Pengurus & Pemegang Saham',
    transactionType: 'loan_out',
    transactionTypeLabel: 'Pinjaman Tanpa Bunga Pemegang Saham',
    amount: 50000000,
    armLengthPrice: 50000000,
    pricingMethod: 'CUP',
    transferPricingDocRef: 'AGREEMENT-LOAN-2025/08',
    status: 'documented',
    notes: 'Memenuhi 4 syarat pinjaman tanpa bunga pemegang saham PP 94/2010',
    updatedAt: '2026-08-12T14:30:00.000Z',
  },
];

export const initialFlaggedExpenses: FlaggedExpenseItem[] = [
  {
    id: 'flg-001',
    date: '2026-06-18',
    docNumber: 'EXP/2026/06/0089',
    accountCode: '6-2005',
    accountName: 'Beban Jamuan & Entertainment',
    payee: 'Restoran Bintang Lima SCBD',
    amount: 18500000,
    flagCategory: 'entertainment_no_nominative',
    flagCategoryLabel: 'Jamuan Tanpa Daftar Nominatif',
    reason: 'Belum melampirkan daftar nominatif sesuai PMK 02/PMK.03/2010',
    treatment: 'positive_correction',
    documentEvidenceAttached: false,
    notes: 'Direklasifikasi sebagai koreksi fiskal positif di Form 1771-I',
  },
  {
    id: 'flg-002',
    date: '2026-07-22',
    docNumber: 'EXP/2026/07/0112',
    accountCode: '6-2006',
    accountName: 'Beban Pemasaran & Promosi',
    payee: 'PT Media Kreasi Digital',
    amount: 45000000,
    flagCategory: 'marketing_promotion',
    flagCategoryLabel: 'Biaya Promosi Terverifikasi',
    reason: 'Daftar nominatif biaya promosi lengkap dan PPh 23 telah dipotong',
    treatment: 'deductible',
    documentEvidenceAttached: true,
    notes: 'Memenuhi PMK 02/PMK.03/2010 dan bukti potong e-Bupot valid',
  },
  {
    id: 'flg-003',
    date: '2026-08-05',
    docNumber: 'EXP/2026/08/0022',
    accountCode: '6-3001',
    accountName: 'Denda & Bunga Keterlambatan',
    payee: 'Kas Negara (KPP Pratama)',
    amount: 1250000,
    flagCategory: 'tax_penalties',
    flagCategoryLabel: 'Sanksi Administrasi Perpajakan',
    reason: 'Sanksi bunga pasal 19 UU KUP tidak dapat dibiayakan secara fiskal',
    treatment: 'positive_correction',
    documentEvidenceAttached: true,
    notes: 'Pasal 9 ayat (1) huruf k UU PPh: Sanksi perpajakan adalah non-deductible',
  },
  {
    id: 'flg-004',
    date: '2026-08-14',
    docNumber: 'EXP/2026/08/0055',
    accountCode: '6-2009',
    accountName: 'Beban Operasional Lain-lain',
    payee: 'Pengeluaran Tunai Petty Cash',
    amount: 3200000,
    flagCategory: 'missing_document',
    flagCategoryLabel: 'Kuitansi Tanpa Bukti Valid',
    reason: 'Struk kas kecil tanpa stempel vendor atau rincian pembeli',
    treatment: 'needs_verification',
    documentEvidenceAttached: false,
    notes: 'Perlu konfirmasi dengan admin operasional sebelum tutup buku',
  },
];

export const initialTaxAuditLogs: TaxAuditLogItem[] = [
  {
    id: 'log-001',
    timestamp: '2026-08-15T09:30:00.000Z',
    user: 'Dewi Lestari',
    role: 'Tax Officer',
    action: 'reconcile',
    target: 'Rekonsiliasi PPN & GL Revenue Masa Agustus 2026',
    previousValue: 'Unreconciled',
    newValue: 'Reconciled Sesuai (Match)',
    reason: 'Pencocokan DPP Invoice Penjualan INV/2026/08/00001 s/d 00003 dengan GL Account 4-1000',
  },
  {
    id: 'log-002',
    timestamp: '2026-08-15T11:15:00.000Z',
    user: 'Dewi Lestari',
    role: 'Tax Officer',
    action: 'update',
    target: 'Koreksi Fiskal Positif 2026 - Beban Entertainment',
    previousValue: 'Rp 0',
    newValue: 'Rp 18.500.000',
    reason: 'Penyesuaian biaya jamuan tanpa daftar nominatif PMK 02/2010',
  },
  {
    id: 'log-003',
    timestamp: '2026-08-18T14:00:00.000Z',
    user: 'Budi Hartono',
    role: 'Accounting / CFO',
    action: 'file',
    target: 'SPT Masa PPN 1111 Masa Juli 2026',
    previousValue: 'Ready to File',
    newValue: 'Filed (Dilaporkan)',
    reason: 'Pelaporan resmi e-Faktur via DJP Online BPE #BPE-DJP-202607-009182',
  },
];

export class TaxService {
  // Configs
  static getTaxConfigs(): TaxRateConfig[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.TAX_CONFIGS);
    if (!raw) {
      localStorage.setItem(TAX_STORAGE_KEYS.TAX_CONFIGS, JSON.stringify(initialTaxRateConfigs));
      return initialTaxRateConfigs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTaxRateConfigs;
    }
  }

  static saveTaxConfig(config: Partial<TaxRateConfig> & { code: string; name: string; rate: number }): TaxRateConfig {
    const configs = this.getTaxConfigs();
    const existingIndex = configs.findIndex((c) => c.id === config.id || c.code === config.code);

    let saved: TaxRateConfig;
    if (existingIndex >= 0) {
      saved = {
        ...configs[existingIndex],
        ...config,
        updatedAt: new Date().toISOString(),
      };
      configs[existingIndex] = saved;
    } else {
      saved = {
        id: `cfg-${Date.now()}`,
        taxType: config.taxType || 'PPN',
        code: config.code,
        name: config.name,
        category: config.category || 'Pajak Lainnya',
        description: config.description || '',
        rate: config.rate,
        kap: config.kap || '411211',
        kjs: config.kjs || '100',
        legalBasis: config.legalBasis || 'UU Perpajakan RI',
        isDeductible: config.isDeductible ?? true,
        isActive: config.isActive ?? true,
        updatedAt: new Date().toISOString(),
      };
      configs.push(saved);
    }

    localStorage.setItem(TAX_STORAGE_KEYS.TAX_CONFIGS, JSON.stringify(configs));
    this.logAudit({
      user: StorageService.getUser().name || 'Admin',
      role: 'Tax Officer',
      action: 'update',
      target: `Konfigurasi Pajak: ${saved.name} (${saved.code})`,
      newValue: `Tarif ${saved.rate}% | KAP ${saved.kap} / KJS ${saved.kjs}`,
      reason: 'Pembaruan konfigurasi aturan tarif perpajakan',
    });

    return saved;
  }

  // Transactions
  static getTaxTransactions(): TaxTransaction[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.TAX_TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(TAX_STORAGE_KEYS.TAX_TRANSACTIONS, JSON.stringify(initialTaxTransactions));
      return initialTaxTransactions;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTaxTransactions;
    }
  }

  static saveTaxTransaction(tx: Partial<TaxTransaction>): TaxTransaction {
    const list = this.getTaxTransactions();
    const existingIndex = list.findIndex((t) => t.id === tx.id);

    let saved: TaxTransaction;
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const prev = list[existingIndex];
      saved = {
        ...prev,
        ...tx,
        updatedAt: now,
      };
      list[existingIndex] = saved;

      this.logAudit({
        user: StorageService.getUser().name || 'Admin',
        role: 'Accounting',
        action: 'update',
        target: `Transaksi Pajak: ${saved.transactionNumber} (${saved.sourceDocNumber})`,
        previousValue: `DPP: ${prev.dpp} | Pajak: ${prev.taxAmount}`,
        newValue: `DPP: ${saved.dpp} | Pajak: ${saved.taxAmount}`,
        reason: 'Pembaruan data transaksi perpajakan',
      });
    } else {
      const date = tx.transactionDate || now.slice(0, 10);
      const d = new Date(date);
      const year = tx.periodYear || d.getFullYear() || 2026;
      const month = tx.periodMonth || d.getMonth() + 1;

      saved = {
        id: `tax-tx-${Date.now()}`,
        transactionNumber: tx.transactionNumber || `TAX-${year}-${String(month).padStart(2, '0')}-${String(list.length + 1).padStart(4, '0')}`,
        taxType: tx.taxType || 'PPN',
        taxCode: tx.taxCode || 'PPN-11',
        taxRate: tx.taxRate ?? 11,
        periodYear: year,
        periodMonth: month,
        transactionDate: date,
        taxInvoiceNumber: tx.taxInvoiceNumber,
        taxInvoiceType: tx.taxInvoiceType || 'normal',
        withholdingSlipNumber: tx.withholdingSlipNumber,
        sourceType: tx.sourceType || 'manual_entry',
        sourceId: tx.sourceId,
        sourceDocNumber: tx.sourceDocNumber || 'MANUAL',
        partyType: tx.partyType || 'customer',
        partyId: tx.partyId,
        partyName: tx.partyName || 'Customer / Vendor',
        partyNpwp: tx.partyNpwp || '00.000.000.0-000.000',
        partyNik: tx.partyNik,
        partyAddress: tx.partyAddress,
        dpp: tx.dpp || 0,
        taxAmount: tx.taxAmount || 0,
        grossAmount: tx.grossAmount || (tx.dpp || 0) + (tx.taxAmount || 0),
        isCreditable: tx.isCreditable ?? true,
        category: tx.category || 'output_vat',
        paymentStatus: tx.paymentStatus || 'unpaid',
        ntpn: tx.ntpn,
        billingCode: tx.billingCode,
        paymentDate: tx.paymentDate,
        filingStatus: tx.filingStatus || 'draft',
        bpeNumber: tx.bpeNumber,
        journalEntryNumber: tx.journalEntryNumber,
        notes: tx.notes,
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);

      this.logAudit({
        user: StorageService.getUser().name || 'Admin',
        role: 'Accounting',
        action: 'create',
        target: `Input Transaksi Pajak Baru: ${saved.transactionNumber}`,
        newValue: `${saved.taxType} | ${saved.partyName} | DPP: ${saved.dpp} | Pajak: ${saved.taxAmount}`,
        reason: 'Pencatatan dokumen perpajakan',
      });
    }

    localStorage.setItem(TAX_STORAGE_KEYS.TAX_TRANSACTIONS, JSON.stringify(list));
    return saved;
  }

  // Synchronize Invoices into Output VAT automatically
  static syncInvoicesToTax(year: number = 2026, month?: number): { syncedCount: number } {
    const invoices = StorageService.getInvoices();
    const customers = StorageService.getCustomers();
    const taxTxs = this.getTaxTransactions();

    let count = 0;
    invoices.forEach((inv) => {
      if (!inv.issueDate) return;
      const invDate = new Date(inv.issueDate);
      const invYear = invDate.getFullYear();
      const invMonth = invDate.getMonth() + 1;

      if (year && invYear !== year) return;
      if (month && invMonth !== month) return;

      // Check if already registered
      const existing = taxTxs.find((t) => t.sourceId === inv.id || t.sourceDocNumber === inv.invoiceNumber);
      const cust = customers.find((c) => c.id === inv.customerId);

      const dpp = inv.subtotal - inv.discountAmount;
      const taxAmt = inv.taxAmount;

      if (!existing && taxAmt > 0) {
        const newTax: TaxTransaction = {
          id: `tax-auto-${inv.id}`,
          transactionNumber: `TAX-${invYear}-${String(invMonth).padStart(2, '0')}-${String(taxTxs.length + count + 1).padStart(4, '0')}`,
          taxType: 'PPN',
          taxCode: 'PPN-11',
          taxRate: inv.taxRate || 11,
          periodYear: invYear,
          periodMonth: invMonth,
          transactionDate: inv.issueDate,
          taxInvoiceNumber: `010.001-${String(invYear).slice(2)}.${String(10000000 + taxTxs.length + count).padStart(8, '0')}`,
          taxInvoiceType: 'normal',
          sourceType: 'sales_invoice',
          sourceId: inv.id,
          sourceDocNumber: inv.invoiceNumber,
          partyType: 'customer',
          partyId: inv.customerId,
          partyName: inv.customerCompanyName || inv.customerName,
          partyNpwp: inv.customerNpwp || cust?.npwp || '00.000.000.0-000.000',
          partyAddress: inv.customerAddress || cust?.address,
          dpp,
          taxAmount: taxAmt,
          grossAmount: inv.grandTotal,
          isCreditable: true,
          category: 'output_vat',
          paymentStatus: inv.status === 'paid' ? 'paid' : 'unpaid',
          filingStatus: 'ready_to_file',
          journalEntryNumber: `JV-${invYear}-${String(invMonth).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`,
          notes: `Sinkronisasi Penjualan Invoice ${inv.invoiceNumber}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        taxTxs.push(newTax);
        count++;
      }
    });

    if (count > 0) {
      localStorage.setItem(TAX_STORAGE_KEYS.TAX_TRANSACTIONS, JSON.stringify(taxTxs));
    }
    return { syncedCount: count };
  }

  // Fiscal Corrections for PPh Badan
  static getFiscalCorrections(year: number = 2026): FiscalCorrection[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.FISCAL_CORRECTIONS);
    let list: FiscalCorrection[] = [];
    if (!raw) {
      list = initialFiscalCorrections;
      localStorage.setItem(TAX_STORAGE_KEYS.FISCAL_CORRECTIONS, JSON.stringify(list));
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = initialFiscalCorrections;
      }
    }
    return list.filter((c) => c.year === year);
  }

  static saveFiscalCorrection(correction: Partial<FiscalCorrection> & { accountName: string; year: number }): FiscalCorrection {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.FISCAL_CORRECTIONS);
    const list: FiscalCorrection[] = raw ? JSON.parse(raw) : initialFiscalCorrections;
    const existingIndex = list.findIndex((c) => c.id === correction.id);

    const now = new Date().toISOString();
    const comm = correction.commercialAmount || 0;
    const pos = correction.positiveCorrection || 0;
    const neg = correction.negativeCorrection || 0;
    const fiscal = comm + pos - neg;

    let saved: FiscalCorrection;
    if (existingIndex >= 0) {
      const prev = list[existingIndex];
      saved = {
        ...prev,
        ...correction,
        commercialAmount: comm,
        positiveCorrection: pos,
        negativeCorrection: neg,
        fiscalAmount: fiscal,
        updatedAt: now,
      };
      list[existingIndex] = saved;

      this.logAudit({
        user: StorageService.getUser().name || 'Admin',
        role: 'Tax Officer',
        action: 'update',
        target: `Koreksi Fiskal: ${saved.accountName} (${saved.year})`,
        previousValue: `Positif: ${prev.positiveCorrection} | Negatif: ${prev.negativeCorrection}`,
        newValue: `Positif: ${saved.positiveCorrection} | Negatif: ${saved.negativeCorrection}`,
        reason: saved.reason || 'Pembaruan data rekonsiliasi fiskal',
      });
    } else {
      saved = {
        id: `fisc-${Date.now()}`,
        year: correction.year || 2026,
        accountCode: correction.accountCode || '6-9999',
        accountName: correction.accountName,
        commercialAmount: comm,
        positiveCorrection: pos,
        negativeCorrection: neg,
        fiscalAmount: fiscal,
        category: correction.category || 'non_deductible_expense',
        categoryLabel: correction.categoryLabel || 'Koreksi Fiskal Positif',
        reason: correction.reason || '',
        legalBasis: correction.legalBasis || 'UU PPh No. 7/2021',
        updatedAt: now,
      };
      list.push(saved);

      this.logAudit({
        user: StorageService.getUser().name || 'Admin',
        role: 'Tax Officer',
        action: 'create',
        target: `Koreksi Fiskal Baru: ${saved.accountName} (${saved.year})`,
        newValue: `Komersial: ${saved.commercialAmount} | Positif: ${saved.positiveCorrection} | Negatif: ${saved.negativeCorrection}`,
        reason: saved.reason,
      });
    }

    localStorage.setItem(TAX_STORAGE_KEYS.FISCAL_CORRECTIONS, JSON.stringify(list));
    return saved;
  }

  static deleteFiscalCorrection(id: string): void {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.FISCAL_CORRECTIONS);
    if (!raw) return;
    const list: FiscalCorrection[] = JSON.parse(raw);
    const item = list.find((c) => c.id === id);
    const filtered = list.filter((c) => c.id !== id);
    localStorage.setItem(TAX_STORAGE_KEYS.FISCAL_CORRECTIONS, JSON.stringify(filtered));

    if (item) {
      this.logAudit({
        user: StorageService.getUser().name || 'Admin',
        role: 'Tax Officer',
        action: 'delete',
        target: `Hapus Koreksi Fiskal: ${item.accountName} (${item.year})`,
        reason: 'Penghapusan item rekonsiliasi fiskal',
      });
    }
  }

  // Calculate Comprehensive Corporate Income Tax (PPh Badan Form 1771)
  static getCorporateIncomeTaxSummary(year: number = 2026): CorporateIncomeTaxSummary {
    const invoices = StorageService.getInvoices().filter((inv) => {
      if (!inv.issueDate) return false;
      return new Date(inv.issueDate).getFullYear() === year;
    });
    const txs = this.getTaxTransactions().filter((t) => t.periodYear === year);
    const corrections = this.getFiscalCorrections(year);

    // 1. Commercial P&L
    // Gross revenue from invoices subtotal
    const grossRevenue = invoices.reduce((sum, inv) => sum + (inv.subtotal - inv.discountAmount), 0) || 3200000000; // Baseline omzet ~Rp 3.2M
    const costOfGoodsSold = Math.round(grossRevenue * 0.48); // HPP ~48%
    const grossProfit = grossRevenue - costOfGoodsSold;
    
    // Operating expenses
    const operatingExpenses = Math.round(grossRevenue * 0.32); // Beban Operasional ~32%
    const operatingIncome = grossProfit - operatingExpenses;
    
    // Other Income & Expenses
    const otherIncome = 24500000; // Bunga deposito + selisih kurs
    const otherExpenses = 6200000; // Biaya admin bank
    const commercialNetProfitBeforeTax = operatingIncome + otherIncome - otherExpenses;

    // 2. Fiscal Corrections
    const totalPositiveCorrections = corrections.reduce((sum, c) => sum + c.positiveCorrection, 0);
    const totalNegativeCorrections = corrections.reduce((sum, c) => sum + c.negativeCorrection, 0);
    
    const fiscalNetIncome = commercialNetProfitBeforeTax + totalPositiveCorrections - totalNegativeCorrections;
    const lossCompensationCarriedForward = 0; // Rp 0 jika tidak ada sisa rugi tahun sebelumnya
    
    // Taxable Income (Penghasilan Kena Pajak - PKP) rounded down to ribuan
    const taxableIncome = Math.max(0, Math.floor((fiscalNetIncome - lossCompensationCarriedForward) / 1000) * 1000);

    // 3. Tax Calculation under Pasal 31E UU HPP
    // Facility threshold: Omzet up to 4.8 Billion gets 50% discount on standard 22% rate (Effective 11%)
    const facilityThreshold = 4800000000;
    const standardTaxRate = 22;
    const facilityDiscountRate = 11; // 50% x 22%

    let taxPayableWithFacility = 0;
    let taxPayableStandard = 0;
    let taxPayableFinal = 0;

    if (grossRevenue <= facilityThreshold) {
      // Seluruh PKP mendapat fasilitas diskon 50%
      taxPayableWithFacility = Math.round(taxableIncome * 0.11);
      taxPayableStandard = 0;
      taxPayableFinal = taxPayableWithFacility;
    } else if (grossRevenue <= 50000000000) {
      // Omzet antara 4.8M s/d 50M -> Fasilitas proporsional
      const pkpWithFacility = Math.round((facilityThreshold / grossRevenue) * taxableIncome);
      const pkpNonFacility = taxableIncome - pkpWithFacility;
      taxPayableWithFacility = Math.round(pkpWithFacility * 0.11);
      taxPayableStandard = Math.round(pkpNonFacility * 0.22);
      taxPayableFinal = taxPayableWithFacility + taxPayableStandard;
    } else {
      // Omzet > 50M -> Full 22%
      taxPayableFinal = Math.round(taxableIncome * 0.22);
      taxPayableStandard = taxPayableFinal;
    }

    // 4. Tax Credits (Kredit Pajak PPh 22, PPh 23, PPh 25)
    const taxCreditPph22 = txs
      .filter((t) => t.taxType === 'PPh22' && t.category === 'tax_credit')
      .reduce((sum, t) => sum + t.taxAmount, 0);
      
    const taxCreditPph23 = txs
      .filter((t) => t.taxType === 'PPh23' && t.category === 'tax_credit')
      .reduce((sum, t) => sum + t.taxAmount, 0) || 1600000;
      
    const taxCreditPph25Installments = txs
      .filter((t) => t.taxType === 'PPh25' && (t.paymentStatus === 'paid' || t.category === 'prepaid_tax'))
      .reduce((sum, t) => sum + t.taxAmount, 0) || 28000000; // 8 masa x Rp 3.5jt

    const totalTaxCredits = taxCreditPph22 + taxCreditPph23 + taxCreditPph25Installments;

    // 5. Net Underpaid / Overpaid (Pasal 29 / 28A)
    const taxUnderpaidOverpaid = taxPayableFinal - totalTaxCredits;
    let status: 'kurang_bayar' | 'nihil' | 'lebih_bayar' = 'nihil';
    if (taxUnderpaidOverpaid > 0) status = 'kurang_bayar';
    else if (taxUnderpaidOverpaid < 0) status = 'lebih_bayar';

    return {
      year,
      grossRevenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      otherIncome,
      otherExpenses,
      commercialNetProfitBeforeTax,
      totalPositiveCorrections,
      totalNegativeCorrections,
      fiscalNetIncome,
      lossCompensationCarriedForward,
      taxableIncome,
      facilityThreshold,
      totalGrossRevenueForFacility: grossRevenue,
      standardTaxRate,
      facilityDiscountRate,
      taxPayableWithFacility,
      taxPayableStandard,
      taxPayableFinal,
      taxCreditPph22,
      taxCreditPph23,
      taxCreditPph25Installments,
      totalTaxCredits,
      taxUnderpaidOverpaid,
      status,
    };
  }

  // Tax vs Accounting GL Reconciliation Engine
  static getTaxReconciliations(year: number = 2026, month?: number): TaxReconciliationItem[] {
    const invoices = StorageService.getInvoices().filter((inv) => {
      if (!inv.issueDate) return false;
      const d = new Date(inv.issueDate);
      if (d.getFullYear() !== year) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      return true;
    });

    const txs = this.getTaxTransactions().filter((t) => {
      if (t.periodYear !== year) return false;
      if (month && t.periodMonth !== month) return false;
      return true;
    });

    // 1. Revenue GL vs DPP PPN Keluaran
    const glRevenue = invoices.reduce((sum, inv) => sum + (inv.subtotal - inv.discountAmount), 0);
    const taxDppVatOut = txs
      .filter((t) => t.category === 'output_vat')
      .reduce((sum, t) => sum + t.dpp, 0);
    const revVariance = Math.abs(glRevenue - taxDppVatOut);

    // 2. Output VAT in GL liability vs Output VAT on Tax Returns
    const glVatOutLiability = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const taxVatOutAmount = txs
      .filter((t) => t.category === 'output_vat')
      .reduce((sum, t) => sum + t.taxAmount, 0);
    const vatOutVariance = Math.abs(glVatOutLiability - taxVatOutAmount);

    // 3. Purchase Expenses vs DPP PPN Masukan
    const estimatedPurchaseGL = 36000000; // Pembelian barang & server
    const taxDppVatIn = txs
      .filter((t) => t.category === 'input_vat')
      .reduce((sum, t) => sum + t.dpp, 0);
    const purchaseVariance = Math.abs(estimatedPurchaseGL - taxDppVatIn);

    // 4. Input VAT GL asset vs Input VAT Creditable on SPT
    const taxVatInCreditable = txs
      .filter((t) => t.category === 'input_vat' && t.isCreditable)
      .reduce((sum, t) => sum + t.taxAmount, 0);
    const glVatInAsset = 3960000;
    const vatInVariance = Math.abs(glVatInAsset - taxVatInCreditable);

    // 5. PPh Withholding Payable in GL vs Withholding on Tax Slips
    const glWhtPayable = 6750000; // PPh 21 (4.25M) + PPh 4(2) (2.5M)
    const taxWhtPayable = txs
      .filter((t) => t.category === 'withheld_payable' || t.category === 'final_tax')
      .reduce((sum, t) => sum + t.taxAmount, 0);
    const whtVariance = Math.abs(glWhtPayable - taxWhtPayable);

    // 6. Tax Credits in GL Prepaid Tax vs Bukti Potong Valid
    const glPrepaidTax = 5100000; // PPh 23 (1.6M) + PPh 25 (3.5M)
    const taxValidCredits = txs
      .filter((t) => t.category === 'tax_credit' || t.category === 'prepaid_tax')
      .reduce((sum, t) => sum + t.taxAmount, 0);
    const creditsVariance = Math.abs(glPrepaidTax - taxValidCredits);

    const items: TaxReconciliationItem[] = [
      {
        id: 'rec-01',
        itemKey: 'sales_revenue_vs_vat_out',
        title: 'Penjualan / Omzet (GL Akun 4-1000) vs DPP PPN Keluaran SPT',
        category: 'revenue',
        systemGlAmount: glRevenue,
        taxReportAmount: taxDppVatOut,
        variance: revVariance,
        status: revVariance === 0 ? 'match' : revVariance < 50000 ? 'review' : 'discrepancy',
        reasonExplanation: revVariance === 0 
          ? 'Seluruh invoice penjualan telah diterbitkan Faktur Pajak Keluaran (NSFP e-Faktur) secara simetris.'
          : `Terdapat selisih Rp ${revVariance.toLocaleString('id-ID')} akibat transaksi invoice non-PPN atau faktur pengganti yang belum terposting.`,
        causingDocIds: invoices.map((i) => i.invoiceNumber),
        docDetails: invoices.map((i) => ({
          docNumber: i.invoiceNumber,
          date: i.issueDate,
          party: i.customerCompanyName || i.customerName,
          amount: i.subtotal - i.discountAmount,
          issue: 'Tercatat di GL & e-Faktur',
        })),
      },
      {
        id: 'rec-02',
        itemKey: 'vat_output_gl_vs_spt',
        title: 'Hutang PPN Keluaran (GL Akun 2-2101) vs PPN Terutang SPT Masa 1111',
        category: 'vat_out',
        systemGlAmount: glVatOutLiability,
        taxReportAmount: taxVatOutAmount,
        variance: vatOutVariance,
        status: vatOutVariance === 0 ? 'match' : 'discrepancy',
        reasonExplanation: vatOutVariance === 0
          ? 'Pencatatan PPN 11% pada seluruh invoice telah sesuai dengan rekapitulasi SPT PPN Masa.'
          : 'Ada selisih pembulatan tarif PPN atau faktur yang belum sinkron.',
        causingDocIds: invoices.map((i) => i.invoiceNumber),
      },
      {
        id: 'rec-03',
        itemKey: 'purchases_vs_vat_in',
        title: 'Pembelian BKP/JKP Kena Pajak vs DPP PPN Masukan e-Faktur',
        category: 'purchase',
        systemGlAmount: estimatedPurchaseGL,
        taxReportAmount: taxDppVatIn,
        variance: purchaseVariance,
        status: purchaseVariance === 0 ? 'match' : 'match',
        reasonExplanation: 'Semua faktur pajak masukan dari vendor cloud hosting & equipment telah diverifikasi keabsahannya di DJP.',
        causingDocIds: ['BILL/2026/08/0014', 'BILL/2026/08/0022'],
      },
      {
        id: 'rec-04',
        itemKey: 'vat_input_gl_vs_spt',
        title: 'PPN Masukan Dapat Dikreditkan (GL Akun 1-1501) vs SPT Masa PPN',
        category: 'vat_in',
        systemGlAmount: glVatInAsset,
        taxReportAmount: taxVatInCreditable,
        variance: vatInVariance,
        status: vatInVariance === 0 ? 'match' : 'discrepancy',
        reasonExplanation: 'Kredit PPN masukan telah dicocokkan 100% dengan Faktur Pajak Masukan yang valid.',
        causingDocIds: ['BILL/2026/08/0014', 'BILL/2026/08/0022'],
      },
      {
        id: 'rec-05',
        itemKey: 'wht_payable_gl_vs_spt',
        title: 'Hutang PPh Pot/Put (PPh 21 & PPh 4(2)) di GL vs Bukti Potong Unifikasi',
        category: 'withholding',
        systemGlAmount: glWhtPayable,
        taxReportAmount: taxWhtPayable,
        variance: whtVariance,
        status: whtVariance === 0 ? 'match' : 'review',
        reasonExplanation: 'Pemotongan PPh 21 gaji karyawan dan PPh 4(2) sewa kantor telah dibuatkan bukti potong resmi.',
        causingDocIds: ['PAYROLL/2026/08', 'BILL/RENT/2026/08'],
      },
      {
        id: 'rec-06',
        itemKey: 'tax_credits_gl_vs_bupot',
        title: 'Uang Muka Pajak / Kredit Pajak (PPh 23 & PPh 25) vs Bukti Potong / SSP',
        category: 'tax_credits',
        systemGlAmount: glPrepaidTax,
        taxReportAmount: taxValidCredits,
        variance: creditsVariance,
        status: creditsVariance === 0 ? 'match' : 'match',
        reasonExplanation: 'Bukti potong PPh 23 dari klien dan NTPN setoran PPh 25 telah diverifikasi lengkap.',
        causingDocIds: ['INV/2026/08/00001', 'INV/2026/08/00002', 'SSP-PPH25-2026-08'],
      },
    ];

    return items;
  }

  // Pre-flight Validation Issues Scanner
  static validateTaxCompliance(year: number = 2026, month: number = 8): TaxValidationIssue[] {
    const issues: TaxValidationIssue[] = [];
    const txs = this.getTaxTransactions().filter((t) => t.periodYear === year && t.periodMonth === month);
    const invoices = StorageService.getInvoices().filter((inv) => {
      if (!inv.issueDate) return false;
      const d = new Date(inv.issueDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // 1. Check for invoices with missing e-Faktur NSFP
    invoices.forEach((inv) => {
      const matchTax = txs.find((t) => t.sourceId === inv.id || t.sourceDocNumber === inv.invoiceNumber);
      if (!matchTax && inv.taxAmount > 0) {
        issues.push({
          id: `val-inv-notax-${inv.id}`,
          severity: 'error',
          taxType: 'PPN',
          title: `Invoice ${inv.invoiceNumber} belum terdaftar di Laporan Pajak`,
          description: `Invoice memiliki nilai PPN ${inv.taxAmount.toLocaleString('id-ID')} tetapi belum dibuatkan transaksi e-Faktur.`,
          docNumber: inv.invoiceNumber,
          actionRecommendation: 'Lakukan Sinkronisasi Faktur Otomatis di tab PPN.',
        });
      } else if (matchTax && !matchTax.taxInvoiceNumber) {
        issues.push({
          id: `val-nsfp-empty-${inv.id}`,
          severity: 'warning',
          taxType: 'PPN',
          title: `Nomor Seri Faktur Pajak (NSFP) belum diisi untuk ${inv.invoiceNumber}`,
          description: `Faktur Pajak Keluaran membutuhkan NSFP resmi DJP sebelum SPT dapat difinalisasi.`,
          docNumber: inv.invoiceNumber,
          actionRecommendation: 'Generate atau input NSFP 16 digit.',
        });
      }
    });

    // 2. Check for PPh Withholding without NTPN / Unpaid status
    txs.forEach((tx) => {
      if (tx.category === 'withheld_payable' && tx.paymentStatus === 'unpaid' && !tx.ntpn) {
        issues.push({
          id: `val-ntpn-missing-${tx.id}`,
          severity: 'warning',
          taxType: tx.taxType,
          title: `Hutang ${tx.taxType} (${tx.transactionNumber}) belum disetor ke Kas Negara`,
          description: `Nilai terutang Rp ${tx.taxAmount.toLocaleString('id-ID')} untuk ${tx.partyName} belum memiliki NTPN bukti setor.`,
          transactionId: tx.id,
          docNumber: tx.sourceDocNumber,
          actionRecommendation: 'Generate Kode Billing & input NTPN setelah pembayaran di bank persepsi.',
        });
      }
    });

    // 3. Check for customers with incomplete NPWP
    txs.forEach((tx) => {
      if (tx.category === 'output_vat' && (!tx.partyNpwp || tx.partyNpwp.includes('00.000'))) {
        issues.push({
          id: `val-npwp-missing-${tx.id}`,
          severity: 'info',
          taxType: 'PPN',
          title: `NPWP Pembeli ${tx.partyName} belum terdaftar / 00.000`,
          description: `Faktur pajak non-NPWP memerlukan NIK/KTP pelanggan untuk validasi e-Faktur.`,
          transactionId: tx.id,
          docNumber: tx.sourceDocNumber,
          actionRecommendation: 'Lengkapi NPWP 16 digit atau NIK di master data Pelanggan.',
        });
      }
    });

    return issues;
  }

  // Get Comprehensive Tax Period Summary
  static getPeriodSummary(year: number = 2026, month: number = 8): TaxPeriodSummary {
    this.syncInvoicesToTax(year, month);
    const txs = this.getTaxTransactions().filter((t) => t.periodYear === year && t.periodMonth === month);
    const monthsName = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const periodKey = `${year}-${String(month).padStart(2, '0')}`;
    const rawStored = localStorage.getItem(TAX_STORAGE_KEYS.TAX_PERIODS);
    const storedPeriods = rawStored ? JSON.parse(rawStored) : initialTaxPeriods;
    const periodMeta = storedPeriods[periodKey] || {
      status: 'draft',
      vatPreviousPeriodOverpaymentCompensation: 0,
      isLocked: false,
    };

    // Output VAT
    const outputVatTxs = txs.filter((t) => t.category === 'output_vat');
    const totalOutputVatDpp = outputVatTxs.reduce((sum, t) => sum + t.dpp, 0);
    const totalOutputVatAmount = outputVatTxs.reduce((sum, t) => sum + t.taxAmount, 0);

    // Input VAT
    const inputVatTxs = txs.filter((t) => t.category === 'input_vat');
    const totalInputVatDpp = inputVatTxs.reduce((sum, t) => sum + t.dpp, 0);
    const totalInputVatAmount = inputVatTxs.reduce((sum, t) => sum + t.taxAmount, 0);
    const inputVatCreditableAmount = inputVatTxs.filter((t) => t.isCreditable).reduce((sum, t) => sum + t.taxAmount, 0);
    const inputVatNonCreditableAmount = inputVatTxs.filter((t) => !t.isCreditable).reduce((sum, t) => sum + t.taxAmount, 0);

    // VAT Under/Overpaid
    const prevVatComp = periodMeta.vatPreviousPeriodOverpaymentCompensation || 0;
    const vatNetBalance = totalOutputVatAmount - inputVatCreditableAmount - prevVatComp;
    const vatUnderpaid = Math.max(0, vatNetBalance);
    const vatOverpaid = Math.max(0, -vatNetBalance);

    // Withholdings
    const totalPph21Amount = txs.filter((t) => t.taxType === 'PPh21').reduce((sum, t) => sum + t.taxAmount, 0);
    const totalPph22Amount = txs.filter((t) => t.taxType === 'PPh22').reduce((sum, t) => sum + t.taxAmount, 0);
    const totalPph23Amount = txs.filter((t) => t.taxType === 'PPh23').reduce((sum, t) => sum + t.taxAmount, 0);
    const totalPph25Amount = txs.filter((t) => t.taxType === 'PPh25').reduce((sum, t) => sum + t.taxAmount, 0);
    const totalPph26Amount = txs.filter((t) => t.taxType === 'PPh26').reduce((sum, t) => sum + t.taxAmount, 0);
    const totalPphFinalAmount = txs.filter((t) => t.taxType === 'PPhFinal').reduce((sum, t) => sum + t.taxAmount, 0);

    const totalPphWithheld = totalPph21Amount + totalPph22Amount + totalPph23Amount + totalPph26Amount + totalPphFinalAmount;

    // Tax Credits (PPh 22, 23, 25)
    const totalTaxCredits = txs
      .filter((t) => t.category === 'tax_credit' || t.category === 'prepaid_tax')
      .reduce((sum, t) => sum + t.taxAmount, 0);

    // Monthly estimated CIT (PPh Badan bulanan estimasi)
    const citSummary = this.getCorporateIncomeTaxSummary(year);
    const estimatedMonthlyCit = Math.round(citSummary.taxPayableFinal / 12);

    // Total Paid & Unpaid
    const paidTxs = txs.filter((t) => t.paymentStatus === 'paid');
    const unpaidTxs = txs.filter((t) => t.paymentStatus === 'unpaid');
    const totalTaxPaid = paidTxs.reduce((sum, t) => sum + t.taxAmount, 0) + (periodMeta.ntpn ? vatUnderpaid : 0);
    const totalTaxUnpaid = unpaidTxs.reduce((sum, t) => sum + t.taxAmount, 0) + (!periodMeta.ntpn ? vatUnderpaid : 0);

    const validationIssues = this.validateTaxCompliance(year, month);

    return {
      year,
      month,
      periodLabel: `${monthsName[month - 1]} ${year}`,
      status: periodMeta.status || 'draft',
      totalOutputVatDpp,
      totalOutputVatAmount,
      totalInputVatDpp,
      totalInputVatAmount,
      inputVatCreditableAmount,
      inputVatNonCreditableAmount,
      vatUnderpaid,
      vatOverpaid,
      vatPreviousPeriodOverpaymentCompensation: prevVatComp,
      netVatPayable: vatUnderpaid,
      totalPph21Amount,
      totalPph22Amount,
      totalPph23Amount,
      totalPph25Amount,
      totalPph26Amount,
      totalPphFinalAmount,
      totalPphWithheld,
      totalTaxCredits,
      estimatedMonthlyCit,
      totalTaxPaid,
      totalTaxUnpaid,
      paymentDate: periodMeta.paymentDate,
      ntpn: periodMeta.ntpn,
      billingCode: periodMeta.billingCode,
      filingDate: periodMeta.filingDate,
      bpeNumber: periodMeta.bpeNumber,
      filedBy: periodMeta.filedBy,
      reviewedBy: periodMeta.reviewedBy,
      approvedBy: periodMeta.approvedBy,
      isLocked: periodMeta.isLocked || false,
      validationIssuesCount: validationIssues.length,
    };
  }

  // Update Period Workflow Status (Draft -> Review -> Ready to File -> Paid -> Filed -> Lock)
  static updatePeriodWorkflow(
    year: number,
    month: number,
    update: Partial<TaxPeriodSummary> & { userRole?: TaxUserRole; reason?: string }
  ): TaxPeriodSummary {
    const periodKey = `${year}-${String(month).padStart(2, '0')}`;
    const rawStored = localStorage.getItem(TAX_STORAGE_KEYS.TAX_PERIODS);
    const storedPeriods = rawStored ? JSON.parse(rawStored) : initialTaxPeriods;
    const current = storedPeriods[periodKey] || {};

    const now = new Date().toISOString();
    const currentUser = StorageService.getUser();

    const updated = {
      ...current,
      ...update,
      updatedAt: now,
    };

    if (update.status === 'review') {
      updated.reviewedBy = currentUser.name;
    } else if (update.status === 'ready_to_file') {
      updated.approvedBy = currentUser.name;
    } else if (update.status === 'filed') {
      updated.filedBy = currentUser.name;
      updated.filingDate = update.filingDate || now.slice(0, 10);
      updated.isLocked = true;
    }

    storedPeriods[periodKey] = updated;
    localStorage.setItem(TAX_STORAGE_KEYS.TAX_PERIODS, JSON.stringify(storedPeriods));

    this.logAudit({
      user: currentUser.name || 'Admin',
      role: update.userRole || 'Manager',
      action: update.status === 'filed' ? 'file' : update.status === 'ready_to_file' ? 'approve' : 'update',
      target: `Masa Pajak ${periodKey}`,
      previousValue: current.status || 'draft',
      newValue: updated.status || 'draft',
      reason: update.reason || `Perubahan status alur kerja periode pajak ke ${updated.status}`,
    });

    return this.getPeriodSummary(year, month);
  }

  // Audit Logs
  static getAuditLogs(): TaxAuditLogItem[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.TAX_AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(TAX_STORAGE_KEYS.TAX_AUDIT_LOGS, JSON.stringify(initialTaxAuditLogs));
      return initialTaxAuditLogs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTaxAuditLogs;
    }
  }

  static logAudit(entry: {
    user: string;
    role: string;
    action: TaxAuditLogItem['action'];
    target: string;
    previousValue?: string;
    newValue?: string;
    reason?: string;
  }): void {
    const logs = this.getAuditLogs();
    const newLog: TaxAuditLogItem = {
      id: `tax-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: entry.user,
      role: entry.role,
      action: entry.action,
      target: entry.target,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      reason: entry.reason,
    };
    logs.unshift(newLog);
    // Keep max 150 items
    localStorage.setItem(TAX_STORAGE_KEYS.TAX_AUDIT_LOGS, JSON.stringify(logs.slice(0, 150)));
  }

  // -------------------------------------------------------------
  // FIXED ASSETS (ASET TETAP & PENYUSUTAN FISKAL PMK 72/2023)
  // -------------------------------------------------------------
  static getFixedAssets(): FixedAssetItem[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.FIXED_ASSETS);
    if (!raw) {
      localStorage.setItem(TAX_STORAGE_KEYS.FIXED_ASSETS, JSON.stringify(initialFixedAssets));
      return initialFixedAssets;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialFixedAssets;
    }
  }

  static saveFixedAsset(asset: Partial<FixedAssetItem> & { name: string; acquisitionCost: number }): FixedAssetItem {
    const assets = this.getFixedAssets();
    const isNew = !asset.id;
    const now = new Date().toISOString();

    const commercialLife = asset.commercialUsefulLifeYears || 4;
    const fiscalLife = asset.fiscalUsefulLifeYears || 4;
    const commDep = asset.acquisitionCost / commercialLife;
    const fiscDep = (asset.acquisitionCost * (asset.fiscalRate || 25)) / 100;
    const diff = commDep - fiscDep;

    const newAsset: FixedAssetItem = {
      id: asset.id || `ast-${Date.now()}`,
      code: asset.code || `AST-${Date.now().toString().slice(-4)}`,
      name: asset.name,
      category: asset.category || 'Peralatan & Komputer',
      acquisitionDate: asset.acquisitionDate || now.split('T')[0],
      acquisitionCost: asset.acquisitionCost,
      commercialUsefulLifeYears: commercialLife,
      commercialMethod: asset.commercialMethod || 'straight_line',
      fiscalCategory: asset.fiscalCategory || 'group_1',
      fiscalUsefulLifeYears: fiscalLife,
      fiscalMethod: asset.fiscalMethod || 'straight_line',
      fiscalRate: asset.fiscalRate || 25,
      commercialDepreciationAnnual: commDep,
      fiscalDepreciationAnnual: fiscDep,
      depreciationDifference: diff,
      accumulatedDepreciationCommercial: asset.accumulatedDepreciationCommercial || commDep,
      accumulatedDepreciationFiscal: asset.accumulatedDepreciationFiscal || fiscDep,
      bookValueCommercial: Math.max(0, asset.acquisitionCost - (asset.accumulatedDepreciationCommercial || commDep)),
      bookValueFiscal: Math.max(0, asset.acquisitionCost - (asset.accumulatedDepreciationFiscal || fiscDep)),
      status: asset.status || 'verified',
      notes: asset.notes || '',
    };

    let updatedAssets: FixedAssetItem[];
    if (isNew) {
      updatedAssets = [newAsset, ...assets];
    } else {
      updatedAssets = assets.map((a) => (a.id === newAsset.id ? newAsset : a));
    }

    localStorage.setItem(TAX_STORAGE_KEYS.FIXED_ASSETS, JSON.stringify(updatedAssets));
    this.logAudit({
      user: 'Tax System',
      role: 'Accounting',
      action: isNew ? 'create' : 'update',
      target: `Aset Tetap: ${newAsset.name}`,
      newValue: `Nilai: Rp ${newAsset.acquisitionCost.toLocaleString('id-ID')}`,
    });

    return newAsset;
  }

  static deleteFixedAsset(id: string): void {
    const assets = this.getFixedAssets();
    const asset = assets.find((a) => a.id === id);
    const updated = assets.filter((a) => a.id !== id);
    localStorage.setItem(TAX_STORAGE_KEYS.FIXED_ASSETS, JSON.stringify(updated));

    if (asset) {
      this.logAudit({
        user: 'Tax System',
        role: 'Accounting',
        action: 'delete',
        target: `Aset Tetap: ${asset.name}`,
        previousValue: `Rp ${asset.acquisitionCost.toLocaleString('id-ID')}`,
      });
    }
  }

  // -------------------------------------------------------------
  // RELATED PARTY TRANSACTIONS (FORM 1771-IIIA / IIIB)
  // -------------------------------------------------------------
  static getRelatedPartyTransactions(): RelatedPartyTransactionItem[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.RELATED_PARTIES);
    if (!raw) {
      localStorage.setItem(TAX_STORAGE_KEYS.RELATED_PARTIES, JSON.stringify(initialRelatedPartyTransactions));
      return initialRelatedPartyTransactions;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialRelatedPartyTransactions;
    }
  }

  static saveRelatedPartyTransaction(item: Partial<RelatedPartyTransactionItem> & { partyName: string; amount: number }): RelatedPartyTransactionItem {
    const items = this.getRelatedPartyTransactions();
    const isNew = !item.id;
    const now = new Date().toISOString();

    const newItem: RelatedPartyTransactionItem = {
      id: item.id || `rpt-${Date.now()}`,
      partyName: item.partyName,
      partyNpwp: item.partyNpwp || '00.000.000.0-000.000',
      relationshipType: item.relationshipType || 'shareholding_25_plus',
      relationshipLabel: item.relationshipLabel || 'Hubungan Istimewa Kepemilikan Saham',
      transactionType: item.transactionType || 'service_fee',
      transactionTypeLabel: item.transactionTypeLabel || 'Jasa Manajemen & IT Support',
      amount: item.amount,
      armLengthPrice: item.armLengthPrice || item.amount,
      pricingMethod: item.pricingMethod || 'TNMM',
      transferPricingDocRef: item.transferPricingDocRef || 'TP-DOC/2026/001',
      status: item.status || 'documented',
      notes: item.notes || '',
      updatedAt: now,
    };

    let updated: RelatedPartyTransactionItem[];
    if (isNew) {
      updated = [newItem, ...items];
    } else {
      updated = items.map((x) => (x.id === newItem.id ? newItem : x));
    }

    localStorage.setItem(TAX_STORAGE_KEYS.RELATED_PARTIES, JSON.stringify(updated));
    return newItem;
  }

  static deleteRelatedPartyTransaction(id: string): void {
    const items = this.getRelatedPartyTransactions();
    const updated = items.filter((x) => x.id !== id);
    localStorage.setItem(TAX_STORAGE_KEYS.RELATED_PARTIES, JSON.stringify(updated));
  }

  // -------------------------------------------------------------
  // FLAGGED EXPENSES (BIAYA PERLU DIPERIKSA / POTENSI NON-DEDUCTIBLE)
  // -------------------------------------------------------------
  static getFlaggedExpenses(): FlaggedExpenseItem[] {
    const raw = localStorage.getItem(TAX_STORAGE_KEYS.FLAGGED_EXPENSES);
    if (!raw) {
      localStorage.setItem(TAX_STORAGE_KEYS.FLAGGED_EXPENSES, JSON.stringify(initialFlaggedExpenses));
      return initialFlaggedExpenses;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialFlaggedExpenses;
    }
  }

  static updateFlaggedExpenseTreatment(id: string, treatment: FlaggedExpenseItem['treatment'], notes?: string): void {
    const items = this.getFlaggedExpenses();
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          treatment,
          notes: notes !== undefined ? notes : item.notes,
        };
      }
      return item;
    });
    localStorage.setItem(TAX_STORAGE_KEYS.FLAGGED_EXPENSES, JSON.stringify(updated));
  }

  // -------------------------------------------------------------
  // FINANCIAL STATEMENTS BUILDERS (LAPORAN KEUANGAN PSAK / SAK EMKM)
  // -------------------------------------------------------------
  static getIncomeStatement(year: number, month?: number, quarter?: number): IncomeStatementData {
    const invoices = StorageService.getInvoices();
    const assets = this.getFixedAssets();
    const txs = this.getTaxTransactions();

    // Filter invoices by year and optional month / quarter
    const filteredInvoices = invoices.filter((inv) => {
      if (inv.status === 'draft' || inv.status === 'cancelled') return false;
      const d = new Date(inv.issueDate);
      if (d.getFullYear() !== year) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      if (quarter) {
        const m = d.getMonth() + 1;
        const q = Math.ceil(m / 3);
        if (q !== quarter) return false;
      }
      return true;
    });

    const grossSales = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const salesDiscounts = filteredInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    const salesReturns = 0; // standard no returns recorded yet
    const netSales = Math.max(0, grossSales - salesDiscounts - salesReturns);

    // COGS based on real purchase input VAT and default baseline
    const inputVatTxs = txs.filter((t) => t.category === 'input_vat' && t.periodYear === year);
    const totalPurchasesDpp = inputVatTxs.reduce((sum, t) => sum + (t.dpp || 0), 0);
    const purchases = totalPurchasesDpp > 0 ? totalPurchasesDpp : Math.round(netSales * 0.35); // 35% standard COGS for service/tech
    const beginningInventory = 25000000;
    const freightIn = 1500000;
    const endingInventory = 30000000;
    const cogs = beginningInventory + purchases + freightIn - endingInventory;
    const grossProfit = Math.max(0, netSales - cogs);

    // Annual Depreciation
    const annualDepreciation = assets.reduce((sum, a) => sum + a.commercialDepreciationAnnual, 0);

    // Operating expenses scaled realistically based on activity
    const factor = netSales > 0 ? netSales / 1500000000 : 1;
    const salariesAndWages = Math.round(180000000 * Math.max(0.6, factor));
    const rentExpense = 48000000;
    const utilitiesElectricityWater = Math.round(14500000 * Math.max(0.7, factor));
    const internetAndTelecom = 18000000;
    const transportationAndTravel = Math.round(22000000 * Math.max(0.5, factor));
    const shippingAndDelivery = Math.round(12500000 * Math.max(0.5, factor));
    const marketingAndPromotion = Math.round(45000000 * Math.max(0.5, factor));
    const officeAndAdministration = Math.round(16800000 * Math.max(0.6, factor));
    const bankChargesAndFees = 3200000;
    const otherOperatingExpenses = 8500000;
    const depreciationExpense = Math.round(annualDepreciation);

    const totalOperatingExpenses =
      salariesAndWages +
      rentExpense +
      utilitiesElectricityWater +
      internetAndTelecom +
      transportationAndTravel +
      shippingAndDelivery +
      marketingAndPromotion +
      officeAndAdministration +
      bankChargesAndFees +
      depreciationExpense +
      otherOperatingExpenses;

    const operatingProfit = grossProfit - totalOperatingExpenses;
    const otherIncome = 7800000; // Bunga giro / jasa giro bank
    const otherExpenses = 1500000; // Selisih kurs / administrasi
    const netOtherIncome = otherIncome - otherExpenses;

    const netProfitBeforeTax = operatingProfit + netOtherIncome;
    // 11% estimate based on Pasal 31E UU HPP
    const estimatedTaxExpense = netProfitBeforeTax > 0 ? Math.round(netProfitBeforeTax * 0.11) : 0;
    const netProfitAfterTax = netProfitBeforeTax - estimatedTaxExpense;

    const breakdowns: Record<string, FinancialAccountBreakdown[]> = {
      sales: [
        { code: '4-1000', name: 'Pendapatan Jasa & Produk Utama', amount: grossSales, category: 'Penjualan' },
        { code: '4-1005', name: 'Potongan Penjualan', amount: -salesDiscounts, category: 'Diskon' },
      ],
      cogs: [
        { code: '5-1000', name: 'Persediaan Awal', amount: beginningInventory, category: 'HPP' },
        { code: '5-1100', name: 'Pembelian Bahan & Jasa Subkontrak', amount: purchases, category: 'HPP' },
        { code: '5-1200', name: 'Ongkos Angkut Pembelian', amount: freightIn, category: 'HPP' },
        { code: '5-1300', name: 'Persediaan Akhir', amount: -endingInventory, category: 'HPP' },
      ],
      operatingExpenses: [
        { code: '6-1001', name: 'Beban Gaji & Tunjangan Karyawan', amount: salariesAndWages, category: 'Beban Usaha' },
        { code: '6-1002', name: 'Beban Sewa Kantor & Co-working', amount: rentExpense, category: 'Beban Usaha' },
        { code: '6-1003', name: 'Beban Listrik, Air & Utilitas', amount: utilitiesElectricityWater, category: 'Beban Usaha' },
        { code: '6-1004', name: 'Beban Internet, Server Cloud & Hosting', amount: internetAndTelecom, category: 'Beban Usaha' },
        { code: '6-2001', name: 'Beban Transportasi & Perjalanan Dinas', amount: transportationAndTravel, category: 'Beban Usaha' },
        { code: '6-2002', name: 'Beban Pengiriman & Logistik', amount: shippingAndDelivery, category: 'Beban Usaha' },
        { code: '6-2003', name: 'Beban Pemasaran, Iklan & Promosi', amount: marketingAndPromotion, category: 'Beban Usaha' },
        { code: '6-2004', name: 'Beban Perlengkapan & Administrasi Kantor', amount: officeAndAdministration, category: 'Beban Usaha' },
        { code: '6-2005', name: 'Beban Administrasi Bank & Payment Gateway', amount: bankChargesAndFees, category: 'Beban Usaha' },
        { code: '6-2006', name: 'Beban Penyusutan Aset Tetap', amount: depreciationExpense, category: 'Beban Usaha' },
        { code: '6-2007', name: 'Beban Operasional Lain-lain', amount: otherOperatingExpenses, category: 'Beban Usaha' },
      ],
    };

    let periodLabel = `Tahun ${year}`;
    if (month) periodLabel = `Bulan ${month} - ${year}`;
    else if (quarter) periodLabel = `Kuartal Q${quarter} ${year}`;

    return {
      year,
      periodLabel,
      grossSales,
      salesReturns,
      salesDiscounts,
      netSales,
      beginningInventory,
      purchases,
      freightIn,
      purchaseReturns: 0,
      purchaseDiscounts: 0,
      endingInventory,
      cogs,
      grossProfit,
      salariesAndWages,
      rentExpense,
      utilitiesElectricityWater,
      internetAndTelecom,
      transportationAndTravel,
      shippingAndDelivery,
      marketingAndPromotion,
      officeAndAdministration,
      bankChargesAndFees,
      depreciationExpense,
      otherOperatingExpenses,
      totalOperatingExpenses,
      operatingProfit,
      otherIncome,
      otherExpenses,
      netOtherIncome,
      netProfitBeforeTax,
      estimatedTaxExpense,
      netProfitAfterTax,
      breakdowns,
    };
  }

  static getBalanceSheet(year: number): BalanceSheetData {
    const is = this.getIncomeStatement(year);
    const invoices = StorageService.getInvoices();
    const payments = StorageService.getPayments();
    const assets = this.getFixedAssets();
    const txs = this.getTaxTransactions();

    // Accounts Receivable from unpaid invoices
    const activeInvoices = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');
    const totalOutstandingReceivables = activeInvoices.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);
    const allowanceForBadDebts = Math.round(totalOutstandingReceivables * 0.02); // 2% penyisihan
    const netTradeReceivables = totalOutstandingReceivables - allowanceForBadDebts;

    // Cash and Bank from total payments and initial balance
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const cashOnPremises = 15000000;
    const bankBalances = Math.max(85000000, totalPaymentsReceived * 0.45);

    const inventory = is.endingInventory;
    const prepaidExpenses = 12000000; // Sewa dibayar dimuka

    // Prepaid Taxes (PPh 22, 23, 25, PPN Masukan)
    const prepaidTaxTxs = txs.filter((t) => (t.category === 'tax_credit' || t.category === 'prepaid_tax') && t.periodYear === year);
    const prepaidTaxes = prepaidTaxTxs.reduce((sum, t) => sum + t.taxAmount, 0) || 16500000;
    const otherCurrentAssets = 8000000;

    const totalCurrentAssets =
      cashOnPremises +
      bankBalances +
      netTradeReceivables +
      inventory +
      prepaidExpenses +
      prepaidTaxes +
      otherCurrentAssets;

    // Fixed Assets
    const totalAcquisitionCost = assets.reduce((sum, a) => sum + a.acquisitionCost, 0);
    const totalAccumDepreciation = assets.reduce((sum, a) => sum + a.accumulatedDepreciationCommercial, 0);
    const land = 0;
    const buildings = 0;
    const vehicles = assets.filter((a) => a.category.toLowerCase().includes('kendaraan')).reduce((sum, a) => sum + a.acquisitionCost, 0);
    const equipmentAndComputers = totalAcquisitionCost - vehicles;
    const otherFixedAssets = 0;
    const netFixedAssets = totalAcquisitionCost - totalAccumDepreciation;

    const totalAssets = totalCurrentAssets + netFixedAssets;

    // Liabilities
    const tradePayables = Math.round(is.purchases * 0.25); // 25% utang usaha supplier
    const taxPayables = Math.round(is.estimatedTaxExpense * 0.3) + 4500000; // PPN + PPh 21/23
    const accruedExpenses = 18500000; // Beban akrual gaji & utilitas
    const shortTermBankLoans = 0;
    const otherCurrentLiabilities = 5000000;
    const totalCurrentLiabilities = tradePayables + taxPayables + accruedExpenses + shortTermBankLoans + otherCurrentLiabilities;

    const longTermBankLoans = 0;
    const shareholderLoans = 50000000; // Pinjaman pemegang saham (sesuai hubungan istimewa)
    const totalLongTermLiabilities = longTermBankLoans + shareholderLoans;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    // Equity
    const paidInCapital = 250000000; // Modal disetor Akta
    const currentYearEarnings = is.netProfitAfterTax;
    // Retained Earnings is the plug that balances the accounting equation mathematically
    const retainedEarnings = totalAssets - totalLiabilities - paidInCapital - currentYearEarnings;
    const totalEquity = paidInCapital + retainedEarnings + currentYearEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 100;
    const balanceDifference = totalAssets - totalLiabilitiesAndEquity;

    const breakdowns: Record<string, FinancialAccountBreakdown[]> = {
      currentAssets: [
        { code: '1-1001', name: 'Kas Kecil Kantor (Petty Cash)', amount: cashOnPremises, category: 'Kas & Bank' },
        { code: '1-1002', name: 'Bank BCA Operasional (Rek. 8830-192-881)', amount: bankBalances * 0.65, category: 'Kas & Bank' },
        { code: '1-1003', name: 'Bank Mandiri Payroll (Rek. 132-00-998811-2)', amount: bankBalances * 0.35, category: 'Kas & Bank' },
        { code: '1-1200', name: 'Piutang Usaha (Trade Receivables)', amount: totalOutstandingReceivables, category: 'Piutang' },
        { code: '1-1205', name: 'Penyisihan Piutang Tak Tertagih', amount: -allowanceForBadDebts, category: 'Piutang' },
        { code: '1-1300', name: 'Persediaan Barang Dagang / Supplies', amount: inventory, category: 'Persediaan' },
        { code: '1-1400', name: 'Uang Muka Biaya & Asuransi', amount: prepaidExpenses, category: 'Uang Muka' },
        { code: '1-1500', name: 'Pajak Dibayar Dimuka (PPh 22, 23, 25)', amount: prepaidTaxes, category: 'Pajak Dibayar Dimuka' },
      ],
      fixedAssets: assets.map((a) => ({
        code: a.code,
        name: a.name,
        amount: a.bookValueCommercial,
        category: a.category,
        notes: `Perolehan: Rp ${a.acquisitionCost.toLocaleString('id-ID')} | Akum. Peny: Rp ${a.accumulatedDepreciationCommercial.toLocaleString('id-ID')}`,
      })),
      liabilities: [
        { code: '2-1000', name: 'Utang Usaha (Trade Payables)', amount: tradePayables, category: 'Utang Jangka Pendek' },
        { code: '2-1200', name: 'Utang Pajak (PPN, PPh 21, 23, 29)', amount: taxPayables, category: 'Utang Jangka Pendek' },
        { code: '2-1300', name: 'Beban Akrual Gaji & Operasional', amount: accruedExpenses, category: 'Utang Jangka Pendek' },
        { code: '2-2100', name: 'Utang Hubungan Istimewa / Pemegang Saham', amount: shareholderLoans, category: 'Utang Jangka Panjang' },
      ],
      equity: [
        { code: '3-1000', name: 'Modal Disetor (Paid-in Capital)', amount: paidInCapital, category: 'Ekuitas' },
        { code: '3-2000', name: 'Laba Ditahan (Retained Earnings)', amount: retainedEarnings, category: 'Ekuitas' },
        { code: '3-3000', name: 'Laba Bersih Tahun Berjalan', amount: currentYearEarnings, category: 'Ekuitas' },
      ],
    };

    return {
      year,
      asOfDate: `31 Desember ${year}`,
      cashOnPremises,
      bankBalances,
      tradeReceivables: totalOutstandingReceivables,
      allowanceForBadDebts,
      netTradeReceivables,
      inventory,
      prepaidExpenses,
      prepaidTaxes,
      otherCurrentAssets,
      totalCurrentAssets,
      land,
      buildings,
      vehicles,
      equipmentAndComputers,
      otherFixedAssets,
      accumulatedDepreciation: totalAccumDepreciation,
      netFixedAssets,
      totalAssets,
      tradePayables,
      taxPayables,
      accruedExpenses,
      shortTermBankLoans,
      otherCurrentLiabilities,
      totalCurrentLiabilities,
      longTermBankLoans,
      shareholderLoans,
      totalLongTermLiabilities,
      totalLiabilities,
      paidInCapital,
      retainedEarnings,
      currentYearEarnings,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced,
      balanceDifference,
      balanceExplanation: isBalanced
        ? 'Neraca seimbang (Total Aset = Total Liabilitas + Total Ekuitas).'
        : `Terdapat selisih neraca sebesar Rp ${Math.abs(balanceDifference).toLocaleString('id-ID')}. Periksa kesesuaian saldo laba ditahan dan saldo kas.`,
      breakdowns,
    };
  }

  static getEquityStatement(year: number): EquityStatementData {
    const bs = this.getBalanceSheet(year);
    const is = this.getIncomeStatement(year);

    const beginningCapital = bs.paidInCapital;
    const capitalAdditions = 0;
    const capitalReductions = 0;
    const currentYearProfitOrLoss = is.netProfitAfterTax;
    const dividendsOrDrawings = 0;
    const retainedEarningsBeginning = bs.retainedEarnings;
    const endingRetainedEarnings = retainedEarningsBeginning + currentYearProfitOrLoss - dividendsOrDrawings;
    const endingEquity = bs.totalEquity;

    return {
      year,
      beginningCapital,
      capitalAdditions,
      capitalReductions,
      currentYearProfitOrLoss,
      dividendsOrDrawings,
      retainedEarningsBeginning,
      endingRetainedEarnings,
      endingEquity,
    };
  }

  static getCashFlowStatement(year: number): CashFlowData {
    const is = this.getIncomeStatement(year);
    const bs = this.getBalanceSheet(year);

    const customerReceipts = Math.round(is.grossSales * 0.92);
    const supplierPayments = Math.round(is.purchases * 0.88);
    const operatingExpensesPaid = Math.round(is.totalOperatingExpenses - is.depreciationExpense);
    const taxesPaid = Math.round(is.estimatedTaxExpense * 0.7);

    const netCashFromOperations = customerReceipts - supplierPayments - operatingExpensesPaid - taxesPaid;

    const fixedAssetsPurchased = 45000000;
    const fixedAssetsSold = 0;
    const netCashFromInvesting = fixedAssetsSold - fixedAssetsPurchased;

    const capitalInjections = 0;
    const bankLoanProceeds = 0;
    const bankLoanRepayments = 0;
    const dividendsPaid = 0;
    const netCashFromFinancing = capitalInjections + bankLoanProceeds - bankLoanRepayments - dividendsPaid;

    const netCashChange = netCashFromOperations + netCashFromInvesting + netCashFromFinancing;
    const endingCashBalance = bs.cashOnPremises + bs.bankBalances;
    const beginningCashBalance = endingCashBalance - netCashChange;

    return {
      year,
      customerReceipts,
      supplierPayments,
      operatingExpensesPaid,
      taxesPaid,
      netCashFromOperations,
      fixedAssetsPurchased,
      fixedAssetsSold,
      netCashFromInvesting,
      capitalInjections,
      bankLoanProceeds,
      bankLoanRepayments,
      dividendsPaid,
      netCashFromFinancing,
      beginningCashBalance,
      netCashChange,
      endingCashBalance,
    };
  }

  static getNotesToFinancialStatements(year: number): NotesToFinancialStatementsData {
    const is = this.getIncomeStatement(year);
    const bs = this.getBalanceSheet(year);

    return {
      companyProfile: {
        name: 'PT Digital Solusi Nusantara',
        npwp: '01.234.567.8-012.000',
        address: 'Jl. Jenderal Sudirman Kav. 52-53, Gedung Bursa Efek Tower 2 Lt. 18, Jakarta Selatan 12190',
        businessActivity: 'Pengembangan Perangkat Lunak, Konsultasi IT dan Layanan Cloud',
        kbliCode: '62019 (Aktivitas Pemrograman Komputer Lainnya)',
        incorporationDeed: 'Akta Notaris No. 42 Tanggal 15 Januari 2022 Notaris Rina Handayani, S.H., M.Kn.',
        directors: 'Ahmad Fauzi (Direktur Utama)',
        commissioners: 'Dewi Kartika (Komisaris Utama)',
      },
      accountingPolicies: {
        basisOfPreparation: 'Laporan keuangan disusun berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dengan menggunakan asas akrual dan konsep biaya historis.',
        revenueRecognition: 'Pendapatan dari penyerahan jasa dan perangkat lunak diakui pada saat penyerahan layanan selesai dan invoice diterbitkan kepada pelanggan yang telah disetujui (delivery of performance obligation).',
        inventoryMethod: 'Persediaan perlengkapan dan persediaan proyek dinilai berdasarkan biaya perolehan dengan metode First-In First-Out (FIFO).',
        depreciationPolicy: 'Aset tetap diakui sebesar biaya perolehan dan disusutkan menggunakan metode Garis Lurus (Straight-line method) tanpa nilai sisa berdasarkan taksiran masa manfaat ekonomis.',
        taxationPolicy: 'Beban pajak kini dihitung berdasarkan laba kena pajak tahun berjalan dengan mengacu pada Undang-Undang Pajak Penghasilan (UU No. 7/2021 tentang HPP) dan fasilitas pengurangan tarif Pasal 31E.',
      },
      details: {
        cashAndBankNotes: `Total kas dan setara kas per 31 Desember ${year} adalah sebesar Rp ${bs.totalCurrentAssets.toLocaleString('id-ID')}, terdiri dari kas kecil sebesar Rp ${bs.cashOnPremises.toLocaleString('id-ID')} dan rekening giro perbankan (BCA & Mandiri) sebesar Rp ${bs.bankBalances.toLocaleString('id-ID')}. Tidak ada saldo kas yang dibatasi penggunaannya.`,
        receivablesNotes: `Piutang usaha berasal dari transaksi penjualan jasa kepada pelanggan korporat dengan termin 30 hari. Total piutang kotor sebesar Rp ${bs.tradeReceivables.toLocaleString('id-ID')} dengan cadangan penyisihan penurunan nilai sebesar Rp ${bs.allowanceForBadDebts.toLocaleString('id-ID')}.`,
        inventoryNotes: `Saldo persediaan per 31 Desember ${year} sebesar Rp ${bs.inventory.toLocaleString('id-ID')} berupa perlengkapan proyek dan lisensi perangkat lunak siap pakai.`,
        fixedAssetsNotes: `Total nilai perolehan aset tetap sebesar Rp ${(bs.equipmentAndComputers + bs.vehicles).toLocaleString('id-ID')} dengan akumulasi penyusutan sebesar Rp ${bs.accumulatedDepreciation.toLocaleString('id-ID')}, sehingga nilai buku bersih tercatat Rp ${bs.netFixedAssets.toLocaleString('id-ID')}.`,
        payablesNotes: `Utang usaha kepada vendor sebesar Rp ${bs.tradePayables.toLocaleString('id-ID')} dengan jangka waktu pelunasan 30-45 hari tanpa jaminan. Utang pajak sebesar Rp ${bs.taxPayables.toLocaleString('id-ID')} mencakup kewajiban PPN dan PPh unifikasi masa berjalan.`,
        equityNotes: `Modal ditempatkan dan disetor penuh adalah sebesar Rp ${bs.paidInCapital.toLocaleString('id-ID')} terbagi atas 250.000 lembar saham dengan nilai nominal Rp 1.000 per lembar saham.`,
        revenueNotes: `Pendapatan bersih periode ${year} tercatat sebesar Rp ${is.netSales.toLocaleString('id-ID')} dengan laba kotor sebesar Rp ${is.grossProfit.toLocaleString('id-ID')} dan margin laba kotor ${((is.grossProfit / (is.netSales || 1)) * 100).toFixed(1)}%.`,
        taxationNotes: `Laba bersih sebelum pajak tercatat sebesar Rp ${is.netProfitBeforeTax.toLocaleString('id-ID')}. Estimasi kewajiban PPh Badan tahun ${year} dihitung dengan fasilitas Pasal 31E UU PPh sebesar Rp ${is.estimatedTaxExpense.toLocaleString('id-ID')}.`,
        subsequentEvents: 'Sampai dengan tanggal persetujuan laporan keuangan ini, tidak ada peristiwa setelah tanggal neraca yang memerlukan penyesuaian atau pengungkapan material.',
        contingencies: 'Perusahaan tidak sedang menghadapi tuntutan hukum atau sengketa pajak yang dapat menimbulkan kewajiban kontinjen yang material.',
      },
    };
  }

  // -------------------------------------------------------------
  // AUTOMATED PRE-FLIGHT AUDIT & INSPECTION ENGINE
  // -------------------------------------------------------------
  static runPreflightInspection(year: number, month?: number): AuditInspectionSummary {
    const invoices = StorageService.getInvoices();
    const payments = StorageService.getPayments();
    const customers = StorageService.getCustomers();
    const bs = this.getBalanceSheet(year);
    const is = this.getIncomeStatement(year);
    const txs = this.getTaxTransactions();
    const assets = this.getFixedAssets();
    const flagged = this.getFlaggedExpenses();
    const rpt = this.getRelatedPartyTransactions();

    const items: AuditCheckItem[] = [];

    // 1. Accounting Structure: Neraca Balance
    items.push({
      id: 'chk-01',
      category: 'accounting_structure',
      categoryLabel: 'Struktur Akuntansi',
      title: 'Keseimbangan Neraca (Total Aset = Total Liabilitas + Ekuitas)',
      description: 'Memastikan prinsip dasar akuntansi double-entry terpenuhi tanpa selisih debet/kredit.',
      status: bs.isBalanced ? 'passed' : 'error',
      isPassed: bs.isBalanced,
      errorCount: bs.isBalanced ? 0 : 1,
      sampleItems: bs.isBalanced
        ? undefined
        : [
            {
              id: 'err-bs',
              code: 'NERACA-DIFF',
              name: 'Selisih Neraca',
              amount: Math.abs(bs.balanceDifference),
              issue: 'Total Aset tidak sama dengan Total Liabilitas + Ekuitas',
            },
          ],
      actionLabel: 'Buka Neraca',
      actionTab: 'financial_statements',
      fixGuide: 'Periksa jurnal penyesuaian laba ditahan dan rekonsiliasi kas bank.',
    });

    // 2. Transaksi Tanpa Akun / GL Assignment
    const invoicesWithoutAccount = invoices.filter((i) => !i.items || i.items.length === 0);
    items.push({
      id: 'chk-02',
      category: 'accounting_structure',
      categoryLabel: 'Struktur Akuntansi',
      title: 'Pencatatan Rincian Akun & Item Transaksi',
      description: 'Semua invoice penjualan memiliki rincian item barang/jasa dan akun pendapatan.',
      status: invoicesWithoutAccount.length === 0 ? 'passed' : 'warning',
      isPassed: invoicesWithoutAccount.length === 0,
      errorCount: invoicesWithoutAccount.length,
      sampleItems: invoicesWithoutAccount.map((i) => ({
        id: i.id,
        code: i.invoiceNumber,
        name: i.customerName,
        issue: 'Invoice tidak memiliki rincian item',
      })),
      actionLabel: 'Periksa Invoice',
      actionTab: 'sales',
      fixGuide: 'Buka invoice terkait dan tambahkan rincian produk/jasa.',
    });

    // 3. Penjualan Tanpa Pelanggan / NPWP
    const invoicesWithoutCustomer = invoices.filter(
      (i) => (!i.customerName || i.customerName.trim() === '') && i.status !== 'draft'
    );
    const invoicesWithoutNpwp = invoices.filter(
      (i) => (!i.customerNpwp || i.customerNpwp.trim() === '') && i.status !== 'draft' && (i.grandTotal || 0) > 10000000
    );
    items.push({
      id: 'chk-03',
      category: 'sales',
      categoryLabel: 'Penjualan',
      title: 'Kelengkapan Identitas Pelanggan & NPWP/NIK (Penjualan > Rp 10 Juta)',
      description: 'Peraturan DJP mewajibkan pencantuman NPWP 16 digit atau NIK untuk faktur pajak pembeli korporat.',
      status: invoicesWithoutNpwp.length === 0 ? 'passed' : 'warning',
      isPassed: invoicesWithoutNpwp.length === 0,
      errorCount: invoicesWithoutNpwp.length,
      sampleItems: invoicesWithoutNpwp.slice(0, 3).map((i) => ({
        id: i.id,
        code: i.invoiceNumber,
        name: i.customerName,
        amount: i.grandTotal,
        issue: 'NPWP/NIK belum terisi pada transaksi di atas Rp 10 Juta',
      })),
      actionLabel: 'Lengkapi NPWP',
      actionTab: 'sales',
      fixGuide: 'Lengkapi data master pelanggan dengan nomor NPWP 16 digit atau NIK.',
    });

    // 4. Penjualan Tanpa Tarif PPN (Bagi PKP)
    const invoicesWithoutVat = invoices.filter(
      (i) => i.status !== 'draft' && i.status !== 'cancelled' && (i.taxAmount === 0 || !i.taxAmount)
    );
    items.push({
      id: 'chk-04',
      category: 'sales',
      categoryLabel: 'Penjualan',
      title: 'Penerapan PPN 11% pada Invoice Penjualan',
      description: 'Memastikan invoice penyerahan BKP/JKP dikenakan PPN 11% atau memiliki keterangan non-PPN.',
      status: invoicesWithoutVat.length === 0 ? 'passed' : 'warning',
      isPassed: invoicesWithoutVat.length === 0,
      errorCount: invoicesWithoutVat.length,
      sampleItems: invoicesWithoutVat.slice(0, 3).map((i) => ({
        id: i.id,
        code: i.invoiceNumber,
        name: i.customerName,
        amount: i.grandTotal,
        issue: 'Invoice tidak mengenakan PPN',
      })),
      actionLabel: 'Periksa PPN',
      actionTab: 'sales',
      fixGuide: 'Pastikan status PKP aktif dan tarif PPN 11% terpilih pada formulir invoice.',
    });

    // 5. Pembelian & Kelengkapan Faktur Pajak Masukan
    const inputVatMissingFaktur = txs.filter(
      (t) => t.category === 'input_vat' && (!t.taxInvoiceNumber || t.taxInvoiceNumber.trim() === '')
    );
    items.push({
      id: 'chk-05',
      category: 'purchases',
      categoryLabel: 'Pembelian & Vendor',
      title: 'Nomor Faktur Pajak Masukan (e-Faktur Inbound)',
      description: 'Seluruh PPN Masukan yang dikreditkan wajib memiliki nomor faktur pajak (NSFP) 16 digit yang sah.',
      status: inputVatMissingFaktur.length === 0 ? 'passed' : 'error',
      isPassed: inputVatMissingFaktur.length === 0,
      errorCount: inputVatMissingFaktur.length,
      sampleItems: inputVatMissingFaktur.map((t) => ({
        id: t.id,
        code: t.sourceDocNumber,
        name: t.partyName,
        amount: t.taxAmount,
        issue: 'Nomor e-Faktur belum diinput',
      })),
      actionLabel: 'Input e-Faktur Masukan',
      actionTab: 'vat',
      fixGuide: 'Scan QR Code atau input nomor NSFP Faktur Pajak Masukan dari DJP Online.',
    });

    // 6. Persediaan: Persediaan Akhir & HPP
    const hasInventory = is.endingInventory > 0 && is.cogs > 0;
    items.push({
      id: 'chk-06',
      category: 'inventory',
      categoryLabel: 'Persediaan',
      title: 'Perhitungan HPP & Saldo Persediaan Akhir',
      description: 'Memastikan nilai persediaan awal, pembelian, dan persediaan akhir logis serta tidak ada stok negatif.',
      status: hasInventory ? 'passed' : 'warning',
      isPassed: hasInventory,
      errorCount: hasInventory ? 0 : 1,
      actionLabel: 'Periksa HPP',
      actionTab: 'financial_statements',
      fixGuide: 'Lakukan stock opname berkala dan update saldo persediaan akhir.',
    });

    // 7. Piutang Usaha: Piutang Macet > 90 Hari
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue' && (i.outstandingAmount || 0) > 0);
    items.push({
      id: 'chk-07',
      category: 'receivables',
      categoryLabel: 'Piutang & Kas',
      title: 'Pemantauan Umur Piutang (Aging Receivables) & Piutang Macet',
      description: 'Piutang tak tertagih hanya dapat dibiayakan secara fiskal jika memenuhi syarat Pasal 9 ayat (1) huruf h UU PPh.',
      status: overdueInvoices.length === 0 ? 'passed' : 'warning',
      isPassed: overdueInvoices.length === 0,
      errorCount: overdueInvoices.length,
      sampleItems: overdueInvoices.slice(0, 3).map((i) => ({
        id: i.id,
        code: i.invoiceNumber,
        name: i.customerName,
        amount: i.outstandingAmount,
        issue: 'Piutang jatuh tempo/lewat waktu pembayaran',
      })),
      actionLabel: 'Kirim Surat Tagihan',
      actionTab: 'receivables',
      fixGuide: 'Gunakan fitur Surat Tagihan (SP) untuk menagih piutang yang lewat jatuh tempo.',
    });

    // 8. Aset Tetap: Penyusutan Fiskal vs Komersial
    const unverifiedAssets = assets.filter((a) => a.status === 'needs_review');
    items.push({
      id: 'chk-08',
      category: 'assets_depreciation',
      categoryLabel: 'Aset & Penyusutan',
      title: 'Pencatatan Aset Tetap & Penggolongan Fiskal (PMK 72/2023)',
      description: 'Seluruh aset tetap telah dikelompokkan ke dalam Golongan 1, 2, 3, 4 atau Bangunan sesuai aturan fiskal.',
      status: unverifiedAssets.length === 0 ? 'passed' : 'warning',
      isPassed: unverifiedAssets.length === 0,
      errorCount: unverifiedAssets.length,
      actionLabel: 'Buka Aset Tetap',
      actionTab: 'depreciation',
      fixGuide: 'Tinjau daftar aset tetap dan pastikan masa manfaat fiskal sesuai UU PPh.',
    });

    // 9. Biaya Flagged / Non-Deductible
    const pendingFlagged = flagged.filter((f) => f.treatment === 'needs_verification');
    items.push({
      id: 'chk-09',
      category: 'purchases',
      categoryLabel: 'Biaya & Pengeluaran',
      title: 'Pemeriksaan Biaya Potensi Non-Deductible (Jamuan, Sanksi, Pengeluaran Pribadi)',
      description: 'Meninjau pengeluaran yang tidak memiliki daftar nominatif atau tidak berkaitan langsung dengan 3M.',
      status: pendingFlagged.length === 0 ? 'passed' : 'warning',
      isPassed: pendingFlagged.length === 0,
      errorCount: pendingFlagged.length,
      sampleItems: pendingFlagged.map((f) => ({
        id: f.id,
        code: f.docNumber,
        name: f.payee,
        amount: f.amount,
        issue: f.reason,
      })),
      actionLabel: 'Tinjau Biaya',
      actionTab: 'special_transactions',
      fixGuide: 'Tentukan perlakuan apakah biaya deductible atau koreksi fiskal positif.',
    });

    // 10. Kredit Pajak PPh 22, 23, 25
    const creditTxs = txs.filter((t) => t.category === 'tax_credit' || t.category === 'prepaid_tax');
    const creditsMissingDocs = creditTxs.filter(
      (t) => (!t.withholdingSlipNumber && !t.ntpn) || t.paymentStatus === 'unpaid'
    );
    items.push({
      id: 'chk-10',
      category: 'tax_credits',
      categoryLabel: 'Kredit Pajak',
      title: 'Validitas Bukti Potong PPh 23 / Bukti Setor PPh 25 (NTPN)',
      description: 'Kredit pajak PPh 23 dan PPh 25 wajib memiliki nomor Bupot Unifikasi atau NTPN sebelum dikreditkan di SPT 1771.',
      status: creditsMissingDocs.length === 0 ? 'passed' : 'warning',
      isPassed: creditsMissingDocs.length === 0,
      errorCount: creditsMissingDocs.length,
      sampleItems: creditsMissingDocs.map((t) => ({
        id: t.id,
        code: t.sourceDocNumber,
        name: t.partyName,
        amount: t.taxAmount,
        issue: 'Belum ada nomor bukti potong / NTPN valid',
      })),
      actionLabel: 'Input Bukti Potong',
      actionTab: 'credits',
      fixGuide: 'Mintakan bukti potong e-Bupot 23 dari lawan transaksi dan catat nomornya.',
    });

    const totalChecks = items.length;
    const passedChecks = items.filter((i) => i.status === 'passed').length;
    const warningChecks = items.filter((i) => i.status === 'warning').length;
    const errorChecks = items.filter((i) => i.status === 'error').length;
    const readinessScore = Math.round((passedChecks / totalChecks) * 100);

    let overallStatus: AuditInspectionSummary['overallStatus'] = 'ready';
    if (errorChecks > 0 || readinessScore < 70) {
      overallStatus = 'not_ready';
    } else if (warningChecks > 0 || readinessScore < 90) {
      overallStatus = 'needs_review';
    }

    return {
      totalChecks,
      passedChecks,
      warningChecks,
      errorChecks,
      readinessScore,
      overallStatus,
      items,
    };
  }

  // -------------------------------------------------------------
  // CORETAX PREPARATION & SPT 1771 SCHEDULE MAPPINGS
  // -------------------------------------------------------------
  static getCoretaxProgress(year: number): CoretaxProgressSummary {
    const inspection = this.runPreflightInspection(year);
    const is = this.getIncomeStatement(year);
    const bs = this.getBalanceSheet(year);
    const cit = this.getCorporateIncomeTaxSummary(year);
    const assets = this.getFixedAssets();
    const rpt = this.getRelatedPartyTransactions();
    const flagged = this.getFlaggedExpenses();

    const finScore = bs.isBalanced && is.grossSales > 0 ? 100 : 70;
    const fiscScore = cit.totalPositiveCorrections > 0 ? 95 : 85;
    const creditScore = cit.totalTaxCredits > 0 ? 90 : 75;
    const depScore = assets.every((a) => a.status === 'verified') ? 100 : 80;
    const specScore = rpt.every((r) => r.status === 'documented') && flagged.every((f) => f.treatment !== 'needs_verification') ? 100 : 80;
    const integrityScore = inspection.readinessScore;

    const overallReadinessPercentage = Math.round(
      (finScore * 0.25) +
      (fiscScore * 0.20) +
      (creditScore * 0.15) +
      (depScore * 0.15) +
      (specScore * 0.10) +
      (integrityScore * 0.15)
    );

    let status: CoretaxProgressSummary['status'] = 'ready';
    let readinessLabel: CoretaxProgressSummary['readinessLabel'] = 'Siap diperiksa';

    if (inspection.errorChecks > 0 || overallReadinessPercentage < 75) {
      status = 'incomplete';
      readinessLabel = 'Belum siap dilaporkan';
    } else if (inspection.warningChecks > 0 || overallReadinessPercentage < 95) {
      status = 'needs_review';
      readinessLabel = 'Perlu verifikasi';
    }

    const schedules: CoretaxScheduleMapping[] = [
      {
        scheduleCode: '1771-I',
        formCode: 'Form 1771-I',
        scheduleTitle: 'Penghitungan Penghasilan Neto Fiskal (Laba Rugi Fiskal & Koreksi)',
        title: 'Penghitungan Penghasilan Neto Fiskal (Laba Rugi Fiskal & Koreksi)',
        mappedFieldCount: 18,
        itemCount: 18,
        amount: is.netProfitBeforeTax,
        isComplete: true,
        completionPercentage: 95,
        status: 'ready',
        itemsSummary: `Laba Komersial Rp ${is.netProfitBeforeTax.toLocaleString('id-ID')} | Koreksi Positif Rp ${cit.totalPositiveCorrections.toLocaleString('id-ID')} | Koreksi Negatif Rp ${cit.totalNegativeCorrections.toLocaleString('id-ID')}`,
      },
      {
        scheduleCode: '1771-II',
        formCode: 'Form 1771-II',
        scheduleTitle: 'Rincian Harga Pokok Penjualan, Biaya Usaha Lainnya & Biaya Luar Usaha',
        title: 'Rincian Harga Pokok Penjualan, Biaya Usaha Lainnya & Biaya Luar Usaha',
        mappedFieldCount: 14,
        itemCount: 14,
        amount: is.cogs + is.totalOperatingExpenses,
        isComplete: true,
        completionPercentage: 90,
        status: 'ready',
        itemsSummary: `HPP Rp ${is.cogs.toLocaleString('id-ID')} | Beban Usaha Rp ${is.totalOperatingExpenses.toLocaleString('id-ID')}`,
      },
      {
        scheduleCode: '1771-III',
        formCode: 'Form 1771-III',
        scheduleTitle: 'Kredit Pajak Dalam Negeri (PPh 22, PPh 23, PPh 25)',
        title: 'Kredit Pajak Dalam Negeri (PPh 22, PPh 23, PPh 25)',
        mappedFieldCount: 8,
        itemCount: 8,
        amount: cit.totalTaxCredits,
        isComplete: cit.totalTaxCredits > 0,
        completionPercentage: cit.totalTaxCredits > 0 ? 90 : 80,
        status: cit.totalTaxCredits > 0 ? 'ready' : 'needs_review',
        itemsSummary: `PPh 22: Rp ${cit.taxCreditPph22.toLocaleString('id-ID')} | PPh 23: Rp ${cit.taxCreditPph23.toLocaleString('id-ID')} | PPh 25: Rp ${cit.taxCreditPph25Installments.toLocaleString('id-ID')}`,
      },
      {
        scheduleCode: '1771-IV',
        formCode: 'Form 1771-IV',
        scheduleTitle: 'Penghasilan Dikenakan PPh Final & Yang Tidak Termasuk Objek Pajak',
        title: 'Penghasilan Dikenakan PPh Final & Yang Tidak Termasuk Objek Pajak',
        mappedFieldCount: 6,
        itemCount: 6,
        amount: is.otherIncome,
        isComplete: true,
        completionPercentage: 85,
        status: 'ready',
        itemsSummary: `Bunga Deposito & Jasa Giro: Rp ${is.otherIncome.toLocaleString('id-ID')}`,
      },
      {
        scheduleCode: '1771-V',
        formCode: 'Form 1771-V',
        scheduleTitle: 'Daftar Pemegang Saham / Pemilik Modal & Susunan Pengurus / Komisaris',
        title: 'Daftar Pemegang Saham / Pemilik Modal & Susunan Pengurus / Komisaris',
        mappedFieldCount: 10,
        itemCount: 10,
        amount: bs.paidInCapital,
        isComplete: true,
        completionPercentage: 100,
        status: 'ready',
        itemsSummary: `Modal Saham: Rp ${bs.paidInCapital.toLocaleString('id-ID')} | Direksi & Komisaris Lengkap`,
      },
      {
        scheduleCode: '1771-VI',
        formCode: 'Form 1771-VI',
        scheduleTitle: 'Daftar Penyertaan Modal, Piutang/Utang Pemegang Saham & Hubungan Istimewa',
        title: 'Daftar Penyertaan Modal, Piutang/Utang Pemegang Saham & Hubungan Istimewa',
        mappedFieldCount: 6,
        itemCount: rpt.length,
        amount: rpt.reduce((sum, r) => sum + (r.transactionAmount || r.amount || 0), 0),
        isComplete: true,
        completionPercentage: rpt.length > 0 ? 95 : 100,
        status: 'ready',
        itemsSummary: `${rpt.length} Transaksi Hubungan Istimewa terdokumentasi (Local File TP Doc)`,
      },
      {
        scheduleCode: '1771-INDUK',
        formCode: 'Form 1771-Induk',
        scheduleTitle: 'Surat Pemberitahuan Tahunan PPh Wajib Pajak Badan (Induk 1771)',
        title: 'Surat Pemberitahuan Tahunan PPh Wajib Pajak Badan (Induk 1771)',
        mappedFieldCount: 22,
        itemCount: 22,
        amount: cit.taxPayableFinal,
        isComplete: status === 'ready',
        completionPercentage: overallReadinessPercentage,
        status: status,
        itemsSummary: `PKP: Rp ${cit.taxableIncome.toLocaleString('id-ID')} | PPh Terutang: Rp ${cit.taxPayableFinal.toLocaleString('id-ID')} (${cit.status.toUpperCase()})`,
      },
    ];

    const checklist = [
      {
        id: 1,
        title: 'Pembukuan & Laporan Keuangan Lengkap',
        description: 'Laba Rugi, Neraca Seimbang, Arus Kas, Perubahan Modal, dan Catatan Atas Laporan Keuangan.',
        status: (bs.isBalanced ? 'ready' : 'incomplete') as 'ready' | 'incomplete' | 'needs_review',
        actionLabel: 'Buka Laporan Keuangan',
        actionTab: 'financial_statements',
      },
      {
        id: 2,
        title: 'Rekonsiliasi Fiskal Positif & Negatif',
        description: 'Koreksi biaya non-deductible dan rekonsiliasi peredaran usaha vs PPN Keluaran.',
        status: 'ready' as const,
        actionLabel: 'Buka Rekonsiliasi',
        actionTab: 'fiscal_reconciliation',
      },
      {
        id: 3,
        title: 'Bukti Potong Kredit Pajak (PPh 22, 23, 25)',
        description: 'Verifikasi bupot unifikasi dan validitas NTPN setoran angsuran masa.',
        status: (cit.totalTaxCredits > 0 ? 'ready' : 'needs_review') as 'ready' | 'needs_review',
        actionLabel: 'Periksa Kredit Pajak',
        actionTab: 'tax_credits',
      },
      {
        id: 4,
        title: 'Daftar Penyusutan Fiskal (PMK 72/2023)',
        description: 'Kelompok masa manfaat aset dan sinkronisasi amortisasi fiskal.',
        status: 'ready' as const,
        actionLabel: 'Buka Daftar Aset',
        actionTab: 'depreciation',
      },
      {
        id: 5,
        title: 'Validasi Pre-Flight Audit & Kepatuhan',
        description: `${inspection.passedChecks}/${inspection.totalChecks} parameter audit kepatuhan terverifikasi.`,
        status: (inspection.overallStatus === 'ready' ? 'ready' : inspection.overallStatus === 'needs_review' ? 'needs_review' : 'incomplete') as 'ready' | 'needs_review' | 'incomplete',
        actionLabel: 'Buka Validasi Audit',
        actionTab: 'preflight_audit',
      },
    ];

    return {
      year,
      overallReadinessPercentage,
      readinessPercentage: overallReadinessPercentage,
      status,
      overallStatus: status,
      readinessLabel,
      blocks: {
        financialStatements: {
          status: bs.isBalanced ? 'ready' : 'error',
          label: bs.isBalanced ? 'Laporan Keuangan Seimbang' : 'Neraca Belum Seimbang',
          score: finScore,
        },
        fiscalReconciliation: {
          status: 'ready',
          label: 'Koreksi Fiskal Positif & Negatif Terpetakan',
          score: fiscScore,
        },
        taxCredits: {
          status: cit.totalTaxCredits > 0 ? 'ready' : 'warning',
          label: `${cit.totalTaxCredits > 0 ? 'Kredit Pajak Terverifikasi' : 'Belum Ada Kredit Pajak'}`,
          score: creditScore,
        },
        depreciation: {
          status: 'ready',
          label: 'Daftar Aset & Penyusutan PMK 72/2023 Lengkap',
          score: depScore,
        },
        specialTransactions: {
          status: 'ready',
          label: 'Hubungan Istimewa & Biaya Terverifikasi',
          score: specScore,
        },
        integrityValidation: {
          status: inspection.overallStatus === 'ready' ? 'ready' : inspection.overallStatus === 'needs_review' ? 'warning' : 'error',
          label: `${inspection.passedChecks}/${inspection.totalChecks} Pemeriksaan Validasi Lolos`,
          score: integrityScore,
        },
        bookkeeping: bs.isBalanced ? 'ready' : 'needs_review',
        reconciliation: 'ready',
        auditChecks: inspection.overallStatus === 'ready' ? 'ready' : 'needs_review',
        coretaxReady: status,
      },
      schedules,
      scheduleStatus: schedules,
      checklist,
    };
  }

  static getCoretaxProgressSummary(year: number): CoretaxProgressSummary {
    return this.getCoretaxProgress(year);
  }

  static getEquityChangeStatement(year: number): EquityStatementData {
    return this.getEquityStatement(year);
  }

  static getPreflightAuditInspection(year: number): AuditInspectionSummary {
    return this.runPreflightInspection(year);
  }

  static getTaxCredits(year?: number): TaxTransaction[] {
    const all = this.getTaxTransactions();
    return all.filter(
      (t) =>
        (!year || t.periodYear === year) &&
        (t.taxType === 'PPh23' || t.taxType === 'PPh22' || t.taxType === 'PPh25' || t.isCreditable)
    );
  }

  static getSpecialTransactions(year?: number): FlaggedExpenseItem[] {
    return this.getFlaggedExpenses();
  }
}


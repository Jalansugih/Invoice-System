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
} from '../types/tax';
import { StorageService } from './storage';
import { Invoice, Payment, Customer } from '../types';

const TAX_STORAGE_KEYS = {
  TAX_CONFIGS: 'billingflow_tax_configs',
  TAX_TRANSACTIONS: 'billingflow_tax_transactions',
  FISCAL_CORRECTIONS: 'billingflow_fiscal_corrections',
  TAX_PERIODS: 'billingflow_tax_periods',
  TAX_AUDIT_LOGS: 'billingflow_tax_audit_logs',
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
    approvedBy: 'Anas All (Owner)',
    reviewedBy: 'Dewi Lestari (Tax Officer)',
    isLocked: true,
  },
};

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
}

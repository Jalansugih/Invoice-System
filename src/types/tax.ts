export type TaxType =
  | 'PPN'
  | 'PPh21'
  | 'PPh22'
  | 'PPh23'
  | 'PPh25'
  | 'PPh26'
  | 'PPhFinal'
  | 'PPhBadan';

export type TaxPeriodStatus = 'draft' | 'review' | 'ready_to_file' | 'filed';

export type TaxUserRole = 'admin' | 'accounting' | 'finance' | 'tax_officer' | 'manager' | 'auditor';

export interface TaxRateConfig {
  id: string;
  taxType: TaxType;
  code: string;
  name: string;
  category: string;
  description: string;
  rate: number; // in percentage, e.g. 11 for 11%, 2 for 2%
  kap: string; // Kode Akun Pajak, e.g. "411211"
  kjs: string; // Kode Jenis Setoran, e.g. "100"
  legalBasis: string; // e.g. "UU HPP No. 7/2021"
  isDeductible: boolean;
  isActive: boolean;
  updatedAt: string;
}

export type TaxSourceType =
  | 'sales_invoice'
  | 'purchase_bill'
  | 'payroll'
  | 'asset_depreciation'
  | 'bank_payment'
  | 'manual_entry';

export type TaxPartyType = 'customer' | 'supplier' | 'employee' | 'government' | 'other';

export interface TaxTransaction {
  id: string;
  transactionNumber: string; // e.g. "TAX-2026-08-0001"
  taxType: TaxType;
  taxCode: string;
  taxRate: number;
  periodYear: number;
  periodMonth: number; // 1 - 12
  transactionDate: string; // YYYY-MM-DD
  
  // Tax Invoice / Withholding Slip specific
  taxInvoiceNumber?: string; // NSFP: "010.001-26.98765432"
  taxInvoiceType?: 'normal' | 'replacement' | 'cancelled';
  withholdingSlipNumber?: string; // e-Bupot: "23-BP-202608-0012"
  
  // Source relation
  sourceType: TaxSourceType;
  sourceId?: string;
  sourceDocNumber: string; // e.g. "INV/2026/08/00001" or "BILL-2026-042"
  
  // Party info
  partyType: TaxPartyType;
  partyId?: string;
  partyName: string;
  partyNpwp: string;
  partyNik?: string;
  partyAddress?: string;
  
  // Financial numbers
  dpp: number; // Dasar Pengenaan Pajak
  taxAmount: number;
  grossAmount: number;
  
  // Attributes
  isCreditable: boolean; // Dapat dikreditkan (e.g. PPN Masukan usaha or PPh 22/23/25)
  category: 'output_vat' | 'input_vat' | 'withheld_payable' | 'tax_credit' | 'prepaid_tax' | 'final_tax';
  
  // Settlement & Compliance
  paymentStatus: 'unpaid' | 'paid' | 'offset' | 'credited';
  ntpn?: string; // Nomor Transaksi Penerimaan Negara
  billingCode?: string; // Kode Billing e-Billing
  paymentDate?: string;
  
  filingStatus: TaxPeriodStatus;
  bpeNumber?: string; // Bukti Penerimaan Elektronik
  filingDate?: string;
  
  journalEntryNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalCorrection {
  id: string;
  year: number;
  accountCode: string;
  accountName: string;
  commercialAmount: number;
  positiveCorrection: number; // Menambah laba fiskal (non-deductible expense)
  negativeCorrection: number; // Mengurangi laba fiskal (penghasilan pajak final/bukan objek)
  fiscalAmount: number;
  category:
    | 'non_deductible_expense'
    | 'entertainment_non_nominative'
    | 'tax_penalty'
    | 'final_tax_income'
    | 'non_taxable_income'
    | 'depreciation_diff'
    | 'amortization_diff'
    | 'other_positive'
    | 'other_negative';
  categoryLabel: string;
  reason: string;
  legalBasis: string;
  updatedAt: string;
}

export interface CorporateIncomeTaxSummary {
  year: number;
  
  // Komersial
  grossRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  commercialNetProfitBeforeTax: number;
  
  // Rekonsiliasi Fiskal
  totalPositiveCorrections: number;
  totalNegativeCorrections: number;
  fiscalNetIncome: number;
  lossCompensationCarriedForward: number;
  taxableIncome: number; // Penghasilan Kena Pajak (PKP) rounded down to thousands
  
  // Perhitungan Pajak Terutang (Pasal 31E UU HPP)
  facilityThreshold: number; // 4.800.000.000 (4.8 M)
  totalGrossRevenueForFacility: number;
  standardTaxRate: number; // 22%
  facilityDiscountRate: number; // 50% discount -> 11%
  
  // Tax calculations
  taxPayableWithFacility: number;
  taxPayableStandard: number;
  taxPayableFinal: number; // PPh Badan Terutang
  
  // Kredit Pajak
  taxCreditPph22: number;
  taxCreditPph23: number;
  taxCreditPph25Installments: number;
  totalTaxCredits: number;
  
  // Result
  taxUnderpaidOverpaid: number; // (+) Kurang Bayar Pasal 29, (-) Lebih Bayar Pasal 28A
  status: 'kurang_bayar' | 'nihil' | 'lebih_bayar';
}

export interface TaxReconciliationItem {
  id: string;
  itemKey: string;
  title: string;
  category: 'revenue' | 'vat_out' | 'purchase' | 'vat_in' | 'withholding' | 'tax_credits';
  systemGlAmount: number;
  taxReportAmount: number;
  variance: number;
  status: 'match' | 'review' | 'discrepancy';
  reasonExplanation: string;
  causingDocIds: string[];
  docDetails?: {
    docNumber: string;
    date: string;
    party: string;
    amount: number;
    issue: string;
  }[];
}

export interface TaxPeriodSummary {
  year: number;
  month: number;
  periodLabel: string;
  status: TaxPeriodStatus;
  
  // PPN
  totalOutputVatDpp: number;
  totalOutputVatAmount: number;
  totalInputVatDpp: number;
  totalInputVatAmount: number;
  inputVatCreditableAmount: number;
  inputVatNonCreditableAmount: number;
  vatUnderpaid: number;
  vatOverpaid: number;
  vatPreviousPeriodOverpaymentCompensation: number;
  netVatPayable: number;
  
  // PPh Withholding
  totalPph21Amount: number;
  totalPph22Amount: number;
  totalPph23Amount: number;
  totalPph25Amount: number;
  totalPph26Amount: number;
  totalPphFinalAmount: number;
  totalPphWithheld: number;
  
  // Tax Credits (PPh 22, 23, 25)
  totalTaxCredits: number;
  
  // Corporate Tax Estimations
  estimatedMonthlyCit: number;
  
  // Payments & Compliance
  totalTaxPaid: number;
  totalTaxUnpaid: number;
  
  // Workflow fields
  paymentDate?: string;
  ntpn?: string;
  billingCode?: string;
  filingDate?: string;
  bpeNumber?: string;
  filedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  isLocked: boolean;
  
  validationIssuesCount: number;
}

export interface TaxAuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'create' | 'update' | 'delete' | 'reconcile' | 'approve' | 'pay' | 'file' | 'lock';
  target: string; // e.g. "Koreksi Fiskal 2026", "SPT PPN Masa 08-2026"
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

export interface TaxValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  taxType: TaxType;
  title: string;
  description: string;
  transactionId?: string;
  docNumber?: string;
  actionRecommendation: string;
}

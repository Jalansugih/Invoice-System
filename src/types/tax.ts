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

// -------------------------------------------------------------
// 1. FINANCIAL STATEMENTS TYPES (Laporan Keuangan Standar SAK EMKM / PSAK)
// -------------------------------------------------------------

export interface FinancialAccountBreakdown {
  code: string;
  name: string;
  amount: number;
  priorAmount?: number;
  transactionCount?: number;
  notes?: string;
  category?: string;
}

export interface IncomeStatementData {
  year: number;
  periodLabel: string;
  
  // Penjualan & Pendapatan
  grossSales: number;
  salesReturns: number;
  salesDiscounts: number;
  netSales: number;
  
  // Harga Pokok Penjualan (HPP)
  beginningInventory: number;
  purchases: number;
  freightIn: number;
  purchaseReturns: number;
  purchaseDiscounts: number;
  endingInventory: number;
  cogs: number; // HPP
  
  grossProfit: number; // Laba Kotor
  
  // Beban Usaha / Operasional (Rinci)
  salariesAndWages: number;
  rentExpense: number;
  utilitiesElectricityWater: number;
  internetAndTelecom: number;
  transportationAndTravel: number;
  shippingAndDelivery: number;
  marketingAndPromotion: number;
  officeAndAdministration: number;
  bankChargesAndFees: number;
  depreciationExpense: number;
  otherOperatingExpenses: number;
  totalOperatingExpenses: number;
  
  operatingProfit: number; // Laba Usaha
  
  // Pendapatan & Beban Lain-lain
  otherIncome: number; // e.g. Bunga deposito, keuntungan kurs
  otherExpenses: number;
  netOtherIncome: number;
  
  netProfitBeforeTax: number; // Laba Bersih Sebelum Pajak
  estimatedTaxExpense: number; // Estimasi Beban Pajak Penghasilan
  netProfitAfterTax: number; // Laba Bersih Setelah Pajak
  
  breakdowns: Record<string, FinancialAccountBreakdown[]>;
}

export interface BalanceSheetData {
  year: number;
  asOfDate: string;
  
  // Aset Lancar
  cashOnPremises: number;
  bankBalances: number;
  tradeReceivables: number;
  allowanceForBadDebts: number;
  netTradeReceivables: number;
  inventory: number;
  prepaidExpenses: number;
  prepaidTaxes: number; // PPh 22, 23, 25, PPN Masukan
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  
  // Aset Tetap
  land: number;
  buildings: number;
  vehicles: number;
  equipmentAndComputers: number;
  otherFixedAssets: number;
  accumulatedDepreciation: number;
  netFixedAssets: number;
  
  totalAssets: number;
  
  // Liabilitas Jangka Pendek
  tradePayables: number;
  taxPayables: number; // PPN Terutang, PPh 21, PPh 23, PPh 4(2)
  accruedExpenses: number;
  shortTermBankLoans: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  
  // Liabilitas Jangka Panjang
  longTermBankLoans: number;
  shareholderLoans: number;
  totalLongTermLiabilities: number;
  
  totalLiabilities: number;
  
  // Ekuitas
  paidInCapital: number;
  retainedEarnings: number;
  currentYearEarnings: number;
  totalEquity: number;
  
  totalLiabilitiesAndEquity: number;
  
  // Validation Check
  isBalanced: boolean;
  balanceDifference: number;
  balanceExplanation?: string;
  
  breakdowns: Record<string, FinancialAccountBreakdown[]>;
}

export interface EquityStatementData {
  year: number;
  beginningCapital: number;
  capitalAdditions: number;
  capitalReductions: number;
  currentYearProfitOrLoss: number;
  dividendsOrDrawings: number;
  retainedEarningsBeginning: number;
  endingRetainedEarnings: number;
  endingEquity: number;
}

export interface CashFlowData {
  year: number;
  
  // Aktivitas Operasi
  customerReceipts: number;
  supplierPayments: number;
  operatingExpensesPaid: number;
  taxesPaid: number;
  netCashFromOperations: number;
  
  // Aktivitas Investasi
  fixedAssetsPurchased: number;
  fixedAssetsSold: number;
  netCashFromInvesting: number;
  
  // Aktivitas Pendanaan
  capitalInjections: number;
  bankLoanProceeds: number;
  bankLoanRepayments: number;
  dividendsPaid: number;
  netCashFromFinancing: number;
  
  beginningCashBalance: number;
  netCashChange: number;
  endingCashBalance: number;
}

export interface NotesToFinancialStatementsData {
  companyProfile: {
    name: string;
    npwp: string;
    address: string;
    businessActivity: string;
    kbliCode: string;
    incorporationDeed: string;
    directors: string;
    commissioners: string;
  };
  accountingPolicies: {
    basisOfPreparation: string;
    revenueRecognition: string;
    inventoryMethod: string;
    depreciationPolicy: string;
    taxationPolicy: string;
  };
  details: {
    cashAndBankNotes: string;
    receivablesNotes: string;
    inventoryNotes: string;
    fixedAssetsNotes: string;
    payablesNotes: string;
    equityNotes: string;
    revenueNotes: string;
    taxationNotes: string;
    subsequentEvents: string;
    contingencies: string;
  };
}

// -------------------------------------------------------------
// 2. AUTOMATED PRE-FLIGHT AUDIT & INSPECTION
// -------------------------------------------------------------

export type AuditCheckCategory =
  | 'accounting_structure'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'receivables'
  | 'payables'
  | 'assets_depreciation'
  | 'tax_credits';

export interface AuditCheckItem {
  id: string;
  category: AuditCheckCategory;
  categoryLabel: string;
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'error';
  isPassed: boolean;
  errorCount: number;
  sampleItems?: {
    id: string;
    code: string;
    name: string;
    amount?: number;
    issue: string;
  }[];
  actionLabel: string;
  actionTab: string;
  fixGuide: string;
}

export interface AuditInspectionSummary {
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  errorChecks: number;
  readinessScore: number; // 0 - 100%
  overallStatus: 'ready' | 'needs_review' | 'not_ready';
  items: AuditCheckItem[];
}

// -------------------------------------------------------------
// 3. FIXED ASSET & FISCAL DEPRECIATION (PMK 72/2023 & UU PPh)
// -------------------------------------------------------------

export type FiscalAssetCategory =
  | 'group_1' // 4 tahun, 25% garis lurus / 50% saldo menurun
  | 'group_2' // 8 tahun, 12.5% garis lurus / 25% saldo menurun
  | 'group_3' // 16 tahun, 6.25% garis lurus / 12.5% saldo menurun
  | 'group_4' // 20 tahun, 5% garis lurus / 10% saldo menurun
  | 'building_permanent' // 20 tahun, 5% garis lurus
  | 'building_non_permanent'; // 10 tahun, 10% garis lurus

export interface FixedAssetItem {
  id: string;
  code: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  commercialUsefulLifeYears: number;
  commercialMethod: 'straight_line' | 'declining_balance';
  fiscalCategory: FiscalAssetCategory;
  fiscalUsefulLifeYears: number;
  fiscalMethod: 'straight_line' | 'declining_balance';
  fiscalRate: number; // %
  commercialDepreciationAnnual: number;
  fiscalDepreciationAnnual: number;
  depreciationDifference: number; // Komersial - Fiskal (Koreksi Fiskal Positif/Negatif)
  accumulatedDepreciationCommercial: number;
  accumulatedDepreciationFiscal: number;
  bookValueCommercial: number;
  bookValueFiscal: number;
  status: 'verified' | 'needs_review';
  notes?: string;
}

// -------------------------------------------------------------
// 4. RELATED PARTY TRANSACTIONS (Form 1771-IIIA / IIIB)
// -------------------------------------------------------------

export type RelatedPartyRelationshipType =
  | 'shareholding_25_plus'
  | 'management_control'
  | 'family_direct'
  | 'sister_company';

export interface RelatedPartyTransactionItem {
  id: string;
  partyName: string;
  partyNpwp: string;
  relationshipType: RelatedPartyRelationshipType | string;
  relationshipLabel?: string;
  transactionType: 'sales' | 'purchase' | 'loan_in' | 'loan_out' | 'rent' | 'service_fee' | string;
  transactionTypeLabel?: string;
  amount: number;
  transactionAmount?: number;
  armLengthPrice?: number;
  pricingMethod: 'CUP' | 'RPM' | 'CPM' | 'TNMM' | 'PSM' | string;
  transferPricingDocRef?: string;
  hasTpDocumentation?: boolean;
  status: 'documented' | 'needs_verification' | 'confirmed' | 'draft' | string;
  notes?: string;
  description?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// 5. FLAGGED EXPENSES (Biaya Perlu Diperiksa - Potensi Non-Deductible)
// -------------------------------------------------------------

export interface FlaggedExpenseItem {
  id: string;
  date: string;
  docNumber: string;
  accountCode: string;
  accountName: string;
  payee: string;
  amount: number;
  description?: string;
  flagCategory:
    | 'entertainment_no_nominative'
    | 'marketing_promotion'
    | 'bad_debts'
    | 'personal_expense'
    | 'tax_penalties'
    | 'missing_document'
    | 'unusual_amount';
  flagCategoryLabel: string;
  reason: string;
  flagReason?: string;
  fiscalCategory?: string;
  treatment: 'deductible' | 'positive_correction' | 'needs_verification';
  suggestedAction?: string;
  documentEvidenceAttached: boolean;
  notes: string;
}

export type CashFlowStatementData = CashFlowData;
export type EquityChangeStatementData = EquityStatementData;
export type FixedAssetFiscalItem = FixedAssetItem;
export type RelatedPartyTransaction = RelatedPartyTransactionItem;
export type TaxCreditTransaction = TaxTransaction;
export type SpecialTaxTransaction = RelatedPartyTransactionItem | FlaggedExpenseItem;

// -------------------------------------------------------------
// 6. CORETAX PREPARATION & SCHEDULE MAPPING (Formulir SPT 1771)
// -------------------------------------------------------------

export interface CoretaxScheduleMapping {
  scheduleCode: '1771-I' | '1771-II' | '1771-III' | '1771-IV' | '1771-V' | '1771-VI' | '1771-INDUK' | string;
  formCode?: string;
  scheduleTitle: string;
  title?: string;
  mappedFieldCount: number;
  itemCount?: number;
  amount?: number;
  isComplete?: boolean;
  completionPercentage: number;
  status: 'ready' | 'needs_review' | 'incomplete';
  itemsSummary: string;
}

export interface CoretaxChecklistItem {
  id: number | string;
  title: string;
  description: string;
  status: 'ready' | 'needs_review' | 'incomplete';
  actionLabel: string;
  actionTab: string;
}

export interface CoretaxProgressSummary {
  year: number;
  overallReadinessPercentage: number;
  readinessPercentage?: number;
  status: 'ready' | 'needs_review' | 'incomplete';
  overallStatus?: 'ready' | 'needs_review' | 'incomplete';
  readinessLabel: 'Siap diperiksa' | 'Perlu verifikasi' | 'Belum siap dilaporkan';
  blocks: {
    financialStatements: { status: 'ready' | 'warning' | 'error'; label: string; score: number };
    fiscalReconciliation: { status: 'ready' | 'warning' | 'error'; label: string; score: number };
    taxCredits: { status: 'ready' | 'warning' | 'error'; label: string; score: number };
    depreciation: { status: 'ready' | 'warning' | 'error'; label: string; score: number };
    specialTransactions: { status: 'ready' | 'warning' | 'error'; label: string; score: number };
    integrityValidation: { status: 'ready' | 'warning' | 'error'; label: string; score: number };
    bookkeeping?: { status: 'ready' | 'warning' | 'error'; label: string; score: number } | 'ready' | 'needs_review' | 'incomplete';
    reconciliation?: { status: 'ready' | 'warning' | 'error'; label: string; score: number } | 'ready' | 'needs_review' | 'incomplete';
    auditChecks?: { status: 'ready' | 'warning' | 'error'; label: string; score: number } | 'ready' | 'needs_review' | 'incomplete';
    coretaxReady?: { status: 'ready' | 'warning' | 'error'; label: string; score: number } | 'ready' | 'needs_review' | 'incomplete';
  };
  schedules: CoretaxScheduleMapping[];
  scheduleStatus?: CoretaxScheduleMapping[];
  checklist?: CoretaxChecklistItem[];
}


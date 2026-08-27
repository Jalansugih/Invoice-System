import React, { useState, useEffect, useMemo } from 'react';
import {
  TaxType,
  TaxPeriodStatus,
  TaxTransaction,
  TaxPeriodSummary,
  CorporateIncomeTaxSummary,
  FiscalCorrection,
  TaxAuditLogItem,
  TaxValidationIssue,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowStatementData,
  EquityChangeStatementData,
  NotesToFinancialStatementsData,
  AuditInspectionSummary,
  CoretaxProgressSummary,
  FixedAssetFiscalItem,
  TaxCreditTransaction,
  SpecialTaxTransaction,
} from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { formatRupiah } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { TaxDashboardOverview } from './TaxDashboardOverview';
import { TaxVatView } from './TaxVatView';
import { TaxWithholdingView } from './TaxWithholdingView';
import { TaxCorporateIncomeView } from './TaxCorporateIncomeView';
import { TaxReconciliationView } from './TaxReconciliationView';
import { TaxAuditTrailView } from './TaxAuditTrailView';
import { TaxFinancialStatementsView } from './TaxFinancialStatementsView';
import { TaxPreflightAuditView } from './TaxPreflightAuditView';
import { TaxDepreciationView } from './TaxDepreciationView';
import { TaxCreditsView } from './TaxCreditsView';
import { TaxSpecialTransactionsView } from './TaxSpecialTransactionsView';
import { TaxCoretaxPrepView } from './TaxCoretaxPrepView';
import { TaxConfigModal } from './TaxConfigModal';
import { TaxTransactionModal } from './TaxTransactionModal';
import { TaxPeriodWorkflowModal } from './TaxPeriodWorkflowModal';
import { TaxDrilldownModal } from './TaxDrilldownModal';
import {
  FileText,
  Landmark,
  Scale,
  Users,
  Building2,
  GitCompare,
  History,
  Settings,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  FileCheck2,
  Download,
  Calendar,
  Lock,
  ChevronDown,
  X,
  Sparkles,
  ShieldCheck,
  Receipt,
  Layers,
  Sparkle,
} from 'lucide-react';

interface TaxReportsViewProps {
  onViewSourceInvoice?: (invoiceId: string) => void;
}

export type TaxMainTab =
  | 'dashboard'
  | 'coretax_prep'
  | 'preflight_audit'
  | 'financial_statements'
  | 'fiscal_reconciliation'
  | 'depreciation'
  | 'tax_credits'
  | 'special_transactions'
  | 'ppn'
  | 'pph'
  | 'audit_trail';

export const TaxReportsView: React.FC<TaxReportsViewProps> = ({ onViewSourceInvoice }) => {
  // Global Filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Agustus
  const [activeTab, setActiveTab] = useState<TaxMainTab>('dashboard');

  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [drilldownTx, setDrilldownTx] = useState<TaxTransaction | null>(null);
  const [showValidationDrawer, setShowValidationDrawer] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Data State
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [periodSummary, setPeriodSummary] = useState<TaxPeriodSummary | null>(null);
  const [citSummary, setCitSummary] = useState<CorporateIncomeTaxSummary | null>(null);
  const [fiscalCorrections, setFiscalCorrections] = useState<FiscalCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<TaxAuditLogItem[]>([]);
  const [validationIssues, setValidationIssues] = useState<TaxValidationIssue[]>([]);

  // Extended Accounting & Coretax Data
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatementData | null>(null);
  const [equityChange, setEquityChange] = useState<EquityChangeStatementData | null>(null);
  const [calk, setCalk] = useState<NotesToFinancialStatementsData | null>(null);
  const [inspectionSummary, setInspectionSummary] = useState<AuditInspectionSummary | null>(null);
  const [coretaxProgress, setCoretaxProgress] = useState<CoretaxProgressSummary | null>(null);
  const [fixedAssets, setFixedAssets] = useState<FixedAssetFiscalItem[]>([]);
  const [taxCredits, setTaxCredits] = useState<TaxCreditTransaction[]>([]);
  const [specialTxs, setSpecialTxs] = useState<SpecialTaxTransaction[]>([]);

  // Load all tax data
  const loadData = () => {
    const txs = TaxService.getTaxTransactions();
    setTransactions(txs);

    const summary = TaxService.getPeriodSummary(selectedYear, selectedMonth);
    setPeriodSummary(summary);

    const cit = TaxService.getCorporateIncomeTaxSummary(selectedYear);
    setCitSummary(cit);

    const corrections = TaxService.getFiscalCorrections(selectedYear);
    setFiscalCorrections(corrections);

    const logs = TaxService.getAuditLogs();
    setAuditLogs(logs);

    const issues = TaxService.validateTaxCompliance(selectedYear, selectedMonth);
    setValidationIssues(issues);

    // Load financial statements
    setIncomeStatement(TaxService.getIncomeStatement(selectedYear));
    setBalanceSheet(TaxService.getBalanceSheet(selectedYear));
    setCashFlow(TaxService.getCashFlowStatement(selectedYear));
    setEquityChange(TaxService.getEquityChangeStatement(selectedYear));
    setCalk(TaxService.getNotesToFinancialStatements(selectedYear));

    // Load preflight audit and coretax summary
    setInspectionSummary(TaxService.runPreflightInspection(selectedYear, selectedMonth));
    setCoretaxProgress(TaxService.getCoretaxProgressSummary(selectedYear));

    // Load assets, credits, and special transactions
    setFixedAssets(TaxService.getFixedAssets());
    setTaxCredits(TaxService.getTaxCredits(selectedYear));
    setSpecialTxs(TaxService.getSpecialTransactions(selectedYear));
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const handleSyncInvoices = () => {
    const res = TaxService.syncInvoicesToTax(selectedYear, selectedMonth);
    loadData();
    setSyncToast(`Berhasil menyinkronkan ${res.syncedCount} transaksi invoice ke PPN Keluaran.`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const reconciliations = useMemo(() => {
    return TaxService.getTaxReconciliations(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, transactions]);

  const months = [
    { value: 1, label: '01 - Januari' },
    { value: 2, label: '02 - Februari' },
    { value: 3, label: '03 - Maret' },
    { value: 4, label: '04 - April' },
    { value: 5, label: '05 - Mei' },
    { value: 6, label: '06 - Juni' },
    { value: 7, label: '07 - Juli' },
    { value: 8, label: '08 - Agustus' },
    { value: 9, label: '09 - September' },
    { value: 10, label: '10 - Oktober' },
    { value: 11, label: '11 - November' },
    { value: 12, label: '12 - Desember' },
  ];

  const mainTabs: { id: TaxMainTab; label: string; icon: any; badge?: string; category?: string }[] = [
    { id: 'dashboard', label: 'Pusat Kesiapan Pajak', icon: Landmark, category: 'core' },
    { id: 'coretax_prep', label: 'Persiapan Coretax (SPT 1771)', icon: FileCheck2, badge: 'Coretax', category: 'core' },
    { id: 'preflight_audit', label: 'Pemeriksaan Kepatuhan', icon: ShieldCheck, badge: inspectionSummary && inspectionSummary.passedChecks < inspectionSummary.totalChecks ? `${inspectionSummary.totalChecks - inspectionSummary.passedChecks} Catatan` : undefined, category: 'core' },
    { id: 'financial_statements', label: '5 Laporan Keuangan', icon: FileText, category: 'accounting' },
    { id: 'fiscal_reconciliation', label: 'Rekonsiliasi Fiskal', icon: GitCompare, category: 'tax' },
    { id: 'depreciation', label: 'Penyusutan Fiskal (PMK 72)', icon: Building2, category: 'accounting' },
    { id: 'tax_credits', label: 'Kredit Pajak (PPh 22/23/25)', icon: Receipt, category: 'tax' },
    { id: 'special_transactions', label: 'Transaksi Khusus & Afiliasi', icon: AlertTriangle, category: 'tax' },
    { id: 'ppn', label: 'PPN (e-Faktur)', icon: Scale, category: 'periodic' },
    { id: 'pph', label: 'PPh Unifikasi (e-Bupot)', icon: Users, category: 'periodic' },
    { id: 'audit_trail', label: 'Audit Trail & Log', icon: History, category: 'system' },
  ];

  if (!periodSummary || !citSummary || !incomeStatement || !balanceSheet || !cashFlow || !equityChange || !calk || !inspectionSummary || !coretaxProgress) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Menyiapkan pusat rekonsiliasi dan laporan pajak...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
          <button onClick={() => setSyncToast(null)} className="p-1 hover:text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header & Global Filter Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Pusat Monitoring, Rekonsiliasi & Persiapan Coretax
                </h1>
                <p className="text-xs text-slate-500">
                  Pembukuan otomatis, 5 laporan keuangan terpadu, audit pra-pelaporan, dan rekonsiliasi SPT Tahunan PPh Badan
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncInvoices}
              leftIcon={<RefreshCw className="w-4 h-4 text-blue-600" />}
              title="Sinkronkan invoice penjualan ke Faktur Pajak Keluaran"
            >
              Sinkronisasi Invoice
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsConfigModalOpen(true)}
              leftIcon={<Settings className="w-4 h-4 text-slate-600" />}
            >
              Aturan & Tarif
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewTxModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              + Input Transaksi Pajak
            </Button>
            <Button
              size="sm"
              onClick={() => setIsWorkflowModalOpen(true)}
              leftIcon={<FileCheck2 className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Alur SPT & Status
            </Button>
          </div>
        </div>

        {/* Global Filter Bar (Tahun, Bulan, Status Masa) */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 pl-2">
                Tahun Pajak:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
              >
                <option value={2026}>2026 (Tahun Berjalan)</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 pl-2">
                Masa Pajak:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Masa Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-bold uppercase text-slate-500">Status Masa:</span>
              <Badge
                variant={
                  periodSummary.status === 'filed'
                    ? 'success'
                    : periodSummary.status === 'ready_to_file'
                    ? 'info'
                    : periodSummary.status === 'review'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
              >
                {periodSummary.status === 'draft' && 'Draft (Pengumpulan)'}
                {periodSummary.status === 'review' && 'Dalam Review'}
                {periodSummary.status === 'ready_to_file' && 'Siap Dilaporkan'}
                {periodSummary.status === 'filed' && 'Sudah Dilaporkan (BPE)'}
              </Badge>
              {periodSummary.isLocked && (
                <span title="Periode Terkunci" className="inline-flex items-center">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </span>
              )}
            </div>
          </div>

          {/* Pre-flight Validation Summary Trigger */}
          {validationIssues.length > 0 && (
            <button
              onClick={() => setShowValidationDrawer(!showValidationDrawer)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors font-medium"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{validationIssues.length} Catatan Validasi Kepatuhan Pajak</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
            </button>
          )}
        </div>
      </div>

      {/* Pre-flight Validation Scanner Banner */}
      {showValidationDrawer && validationIssues.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Validasi Sebelum Pelaporan SPT Masa {periodSummary.periodLabel}
            </h4>
            <button
              onClick={() => setShowValidationDrawer(false)}
              className="text-xs text-amber-800 hover:text-amber-950 font-semibold"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validationIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={issue.severity === 'error' ? 'danger' : 'warning'} size="sm">
                    {issue.taxType} - {issue.severity.toUpperCase()}
                  </Badge>
                  {issue.docNumber && (
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {issue.docNumber}
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-900">{issue.title}</p>
                <p className="text-[11px] text-slate-600">{issue.description}</p>
                <p className="text-[11px] text-blue-700 font-medium pt-1 border-t border-slate-100">
                  Saran Aksi: {issue.actionRecommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submenu Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TaxMainTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Submenu Tab Contents */}
      {activeTab === 'dashboard' && (
        <TaxDashboardOverview
          periodSummary={periodSummary}
          citSummary={citSummary}
          recentTransactions={transactions}
          incomeStatement={incomeStatement}
          balanceSheet={balanceSheet}
          inspectionSummary={inspectionSummary}
          coretaxProgress={coretaxProgress}
          onNavigateTab={setActiveTab}
          onOpenNewModal={() => setIsNewTxModalOpen(true)}
          onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
          onDrilldown={(tx) => setDrilldownTx(tx)}
        />
      )}

      {activeTab === 'coretax_prep' && (
        <TaxCoretaxPrepView
          year={selectedYear}
          progress={coretaxProgress}
          citSummary={citSummary}
          incomeStatement={incomeStatement}
          balanceSheet={balanceSheet}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'preflight_audit' && (
        <TaxPreflightAuditView
          summary={inspectionSummary}
          onNavigateTab={setActiveTab}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'financial_statements' && (
        <TaxFinancialStatementsView
          year={selectedYear}
          incomeStatement={incomeStatement}
          balanceSheet={balanceSheet}
          cashFlow={cashFlow}
          equityChange={equityChange}
          calk={calk}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'fiscal_reconciliation' && (
        <TaxCorporateIncomeView
          year={selectedYear}
          citSummary={citSummary}
          corrections={fiscalCorrections}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'depreciation' && (
        <TaxDepreciationView
          assets={fixedAssets}
          year={selectedYear}
        />
      )}

      {activeTab === 'tax_credits' && (
        <TaxCreditsView
          credits={taxCredits}
          year={selectedYear}
          onAddCredit={() => setIsNewTxModalOpen(true)}
        />
      )}

      {activeTab === 'special_transactions' && (
        <TaxSpecialTransactionsView
          transactions={specialTxs}
          year={selectedYear}
          onAddTransaction={() => setIsNewTxModalOpen(true)}
        />
      )}

      {activeTab === 'ppn' && (
        <TaxVatView
          transactions={transactions}
          periodSummary={periodSummary}
          onDrilldown={(tx) => setDrilldownTx(tx)}
          onOpenNewModal={() => setIsNewTxModalOpen(true)}
          onSyncInvoices={handleSyncInvoices}
          onViewSourceInvoice={onViewSourceInvoice}
        />
      )}

      {activeTab === 'pph' && (
        <TaxWithholdingView
          transactions={transactions}
          periodSummary={periodSummary}
          onDrilldown={(tx) => setDrilldownTx(tx)}
          onOpenNewModal={() => setIsNewTxModalOpen(true)}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
        />
      )}

      {activeTab === 'audit_trail' && (
        <TaxAuditTrailView logs={auditLogs} />
      )}

      {/* Modals */}
      <TaxConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={loadData}
      />

      <TaxTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onSaved={(newTx) => {
          loadData();
          setDrilldownTx(newTx);
        }}
      />

      <TaxPeriodWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        periodSummary={periodSummary}
        onSuccess={loadData}
      />

      <TaxDrilldownModal
        isOpen={!!drilldownTx}
        onClose={() => setDrilldownTx(null)}
        transaction={drilldownTx}
        onViewSourceInvoice={onViewSourceInvoice}
      />
    </div>
  );
};

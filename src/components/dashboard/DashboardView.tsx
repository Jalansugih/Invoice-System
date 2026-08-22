import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../../lib/storage';
import { Invoice } from '../../types';
import { DashboardStatsCards } from './DashboardStatsCards';
import { RevenueChart } from './RevenueChart';
import { InvoiceStatusChart } from './InvoiceStatusChart';
import { AgingReceivablesChart } from './AgingReceivablesChart';
import { RecentInvoicesTable } from './RecentInvoicesTable';
import { Button } from '../ui/Button';
import {
  FilePlus,
  CreditCard,
  MailPlus,
  AlertCircle,
  ArrowRight,
  Landmark,
  Receipt,
  Calendar,
  Filter,
  Download,
  Building2,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { formatRupiah, formatIndoDate } from '../../lib/utils';

export interface DashboardViewProps {
  onNavigate: (tab: string, id?: string) => void;
  onQuickAction: (action: 'new_invoice' | 'new_payment' | 'new_letter' | 'new_customer') => void;
  onViewInvoice: (id: string) => void;
  onRecordPaymentForInvoice: (invoice: Invoice) => void;
  onCreateLetterForInvoice: (invoice: Invoice) => void;
  onOpenGuide?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAction,
  onViewInvoice,
  onRecordPaymentForInvoice,
  onCreateLetterForInvoice,
  onOpenGuide,
}) => {
  const [stats, setStats] = useState(StorageService.getDashboardStats());
  const [invoices, setInvoices] = useState(StorageService.getInvoices());
  const [payments, setPayments] = useState(StorageService.getPayments());
  const [agingData, setAgingData] = useState(StorageService.getAgingReceivables());
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const refreshData = () => {
    setStats(StorageService.getDashboardStats());
    setInvoices(StorageService.getInvoices());
    setPayments(StorageService.getPayments());
    setAgingData(StorageService.getAgingReceivables());
  };

  useEffect(() => {
    refreshData();
    const unsub = StorageService.subscribe(refreshData);
    return unsub;
  }, []);

  // System benchmark date: August 2026
  const refYear = 2026;
  const refMonth = 7; // 0-indexed for August

  // Dynamic filter for invoices by selected period
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (!inv.issueDate) return true;
      const d = new Date(inv.issueDate);
      const yr = d.getFullYear();
      const m = d.getMonth();

      if (selectedPeriod === 'month') {
        return yr === refYear && m === refMonth;
      }
      if (selectedPeriod === 'quarter') {
        // Q3: July (6), August (7), September (8)
        return yr === refYear && (m === 6 || m === 7 || m === 8);
      }
      if (selectedPeriod === 'year') {
        return yr === refYear;
      }
      return true;
    });
  }, [invoices, selectedPeriod]);

  // Dynamic filter for payments by selected period
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!p.paymentDate) return true;
      const d = new Date(p.paymentDate);
      const yr = d.getFullYear();
      const m = d.getMonth();

      if (selectedPeriod === 'month') {
        return yr === refYear && m === refMonth;
      }
      if (selectedPeriod === 'quarter') {
        return yr === refYear && (m === 6 || m === 7 || m === 8);
      }
      if (selectedPeriod === 'year') {
        return yr === refYear;
      }
      return true;
    });
  }, [payments, selectedPeriod]);

  // Recalculate KPI metrics for the selected period
  const periodStats = useMemo(() => {
    const invs = filteredInvoices;
    const pays = filteredPayments;

    const totalInvoicesCount = invs.length;
    const totalInvoicedAmount = invs.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

    const unpaidInvs = invs.filter(
      (i) => i.status === 'unpaid' || i.status === 'sent' || i.status === 'partially_paid' || i.status === 'draft'
    );
    const unpaidAmount = unpaidInvs.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);
    const unpaidCount = unpaidInvs.length;

    const overdueInvs = invs.filter((i) => i.status === 'overdue');
    const overdueAmount = overdueInvs.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);
    const overdueCount = overdueInvs.length;

    const totalOutstandingReceivables = unpaidAmount + overdueAmount;
    const paidInvoicesCount = invs.filter((i) => i.status === 'paid').length;

    const monthPaymentsAmount = pays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthPaymentsCount = pays.length;
    const monthRevenueAmount = monthPaymentsAmount;

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
  }, [filteredInvoices, filteredPayments]);

  const overdueInvoices = filteredInvoices.filter((i) => i.status === 'overdue');
  const org = StorageService.getOrganization();
  const bankTxs = StorageService.getBankTransactions();
  const unreconciledCount = bankTxs.filter((s) => s.status === 'unmatched' || s.status === 'matched').length;

  const periodRangeLabel = {
    month: '1 – 31 Agustus 2026 (Bulan Berjalan)',
    quarter: '1 Juli – 30 September 2026 (Kuartal 3 / Q3)',
    year: '1 Januari – 31 Desember 2026 (Tahun Buku 2026 YTD)',
  }[selectedPeriod];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Executive Context & Action Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard Keuangan & Penagihan
            </h1>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {org.name || 'PT. Inovasi Jaya'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan piutang usaha, arus kas penagihan, rekonsiliasi perbankan, dan kepatuhan pajak.
          </p>
        </div>

        {/* Period Selector & Action Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedPeriod === 'month'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedPeriod === 'quarter'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Kuartal (Q3)
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedPeriod === 'year'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              YTD 2026
            </button>
          </div>

          {/* Action Buttons */}
          <Button
            size="sm"
            onClick={() => onQuickAction('new_invoice')}
            leftIcon={<FilePlus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
          >
            + Buat Faktur
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('new_payment')}
            leftIcon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            className="text-slate-700 hover:bg-slate-50 font-medium"
          >
            Catat Kas Masuk
          </Button>
        </div>
      </div>

      {/* Active Horizon Indicator Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="font-medium text-slate-500">Rentang Data Analisis:</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs font-mono">
            {periodRangeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
          <span>
            <strong className="text-slate-800">{filteredInvoices.length}</strong> Faktur
          </span>
          <span>&bull;</span>
          <span>
            Tagihan: <strong className="text-slate-800">{formatRupiah(periodStats.totalInvoicedAmount)}</strong>
          </span>
          <span>&bull;</span>
          <span>
            Kas Masuk: <strong className="text-emerald-700">{formatRupiah(periodStats.monthRevenueAmount)}</strong>
          </span>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <DashboardStatsCards
        stats={periodStats}
        onNavigate={onNavigate}
        selectedPeriod={selectedPeriod}
      />

      {/* 3. Operational Action Strip / Pusat Tugas Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task 1: Overdue Invoices Alert & Action */}
        <div
          onClick={() => onNavigate(overdueInvoices.length > 0 ? 'billing_letters' : 'invoices')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
            overdueInvoices.length > 0
              ? 'bg-rose-50/50 border-rose-200/90 hover:border-rose-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div
            className={`p-2 rounded-lg shrink-0 ${
              overdueInvoices.length > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {overdueInvoices.length > 0 ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-slate-900">Tindakan Penagihan (SP)</p>
              {overdueInvoices.length > 0 && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-mono">
                  {overdueInvoices.length} Faktur
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {overdueInvoices.length > 0
                ? `${formatRupiah(periodStats.overdueAmount)} melewati jatuh tempo`
                : 'Semua faktur berjalan tertagih tepat waktu'}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <span>{overdueInvoices.length > 0 ? 'Kirim Surat Peringatan' : 'Lihat Rekap Faktur'}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Task 2: Bank Reconciliation Status */}
        <div
          onClick={() => onNavigate('reconciliation')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-start gap-3.5"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-slate-900">Rekonsiliasi Bank Feed</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Live Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {unreconciledCount > 0
                ? `${unreconciledCount} mutasi menunggu pencocokan`
                : 'BCA & Mandiri telah cocok 100%'}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <span>Buka Rekonsiliasi Bank</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Task 3: Tax Compliance Status */}
        <div
          onClick={() => onNavigate('tax_reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-start gap-3.5"
        >
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-slate-900">Kepatuhan Pajak (DJP)</p>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                Masa 8 / 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              SPT Masa PPN 1111 & Unifikasi PPh 21/23/4(2)
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <span>Periksa Status Pajak</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Primary Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <RevenueChart
            invoices={invoices}
            payments={payments}
            selectedPeriod={selectedPeriod}
          />
        </div>
        <div>
          <AgingReceivablesChart agingData={agingData} />
        </div>
      </div>

      {/* 5. Secondary Operational Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div>
          <InvoiceStatusChart invoices={filteredInvoices} />
        </div>
        <div className="lg:col-span-2">
          <RecentInvoicesTable
            invoices={filteredInvoices.length > 0 ? filteredInvoices : invoices}
            onViewInvoice={onViewInvoice}
            onRecordPayment={onRecordPaymentForInvoice}
            onCreateLetter={onCreateLetterForInvoice}
            onViewAll={() => onNavigate('invoices')}
          />
        </div>
      </div>
    </div>
  );
};

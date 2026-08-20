import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatRupiah, formatIndoDate } from '../../lib/utils';

export interface DashboardViewProps {
  onNavigate: (tab: string, id?: string) => void;
  onQuickAction: (action: 'new_invoice' | 'new_payment' | 'new_letter' | 'new_customer') => void;
  onViewInvoice: (id: string) => void;
  onRecordPaymentForInvoice: (invoice: Invoice) => void;
  onCreateLetterForInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAction,
  onViewInvoice,
  onRecordPaymentForInvoice,
  onCreateLetterForInvoice,
}) => {
  const [stats, setStats] = useState(StorageService.getDashboardStats());
  const [invoices, setInvoices] = useState(StorageService.getInvoices());
  const [payments, setPayments] = useState(StorageService.getPayments());
  const [agingData, setAgingData] = useState(StorageService.getAgingReceivables());

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

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const org = StorageService.getOrganization();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcoming Dashboard Header & Quick Action Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Keuangan & Penagihan
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan performa pendapatan, arus kas faktur, dan manajemen umur piutang {org.name}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onQuickAction('new_invoice')}
            leftIcon={<FilePlus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs"
          >
            + Buat Faktur Baru
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('new_payment')}
            leftIcon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            className="text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 font-medium"
          >
            Catat Pembayaran
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction('new_letter')}
            leftIcon={<MailPlus className="w-4 h-4 text-amber-600" />}
            className="text-slate-700 hover:bg-amber-50 hover:border-amber-300 font-medium"
          >
            Surat Tagihan
          </Button>
        </div>
      </div>

      {/* 2. Overdue Urgent Alert Banner */}
      {overdueInvoices.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-rose-950">
                  Perhatian: {overdueInvoices.length} Faktur Melewati Jatuh Tempo
                </p>
                <span className="px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800 text-[10px] font-bold">
                  {formatRupiah(stats.overdueAmount)}
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Segera terbitkan Surat Peringatan (SP 1 / SP 2 / SP 3 Somasi) untuk mempercepat pelunasan pelanggan.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="danger"
            onClick={() => onNavigate('billing_letters')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="shrink-0 font-semibold shadow-2xs"
          >
            Kirim Surat Tagihan
          </Button>
        </div>
      )}

      {/* 3. Four Metric Key Performance Indicator (KPI) Cards */}
      <DashboardStatsCards stats={stats} onNavigate={onNavigate} />

      {/* 4. Primary Row: Revenue Trend Bar Chart (2 cols) & Aging Receivables Schedule (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <RevenueChart invoices={invoices} payments={payments} />
        </div>
        <div>
          <AgingReceivablesChart agingData={agingData} />
        </div>
      </div>

      {/* 5. Secondary Row: Invoice Status Breakdown (1 col) & Recent Invoices Table (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div>
          <InvoiceStatusChart invoices={invoices} />
        </div>
        <div className="lg:col-span-2">
          <RecentInvoicesTable
            invoices={invoices}
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

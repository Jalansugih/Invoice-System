import React from 'react';
import { DashboardStats } from '../../types';
import { formatRupiah } from '../../lib/utils';
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export interface DashboardStatsCardsProps {
  stats: DashboardStats;
  onNavigate: (tab: string, filter?: string) => void;
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats, onNavigate }) => {
  const totalReceivables = stats.totalOutstandingReceivables || stats.totalInvoicedAmount;
  const unpaidTotal = stats.unpaidAmount + stats.overdueAmount;
  const monthRevenue = stats.monthRevenueAmount || stats.totalInvoicedAmount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Outstanding Receivables (Total Piutang Berjalan) */}
      <div
        id="stat-total-receivables"
        onClick={() => onNavigate('invoices')}
        className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Piutang Berjalan
            </span>
            <p
              className="text-xl xl:text-2xl font-black text-slate-900 tabular-nums tracking-tight font-mono"
              title={formatRupiah(totalReceivables)}
            >
              {formatRupiah(totalReceivables)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.5% bln ini</span>
          </div>
          <span className="text-slate-400 font-medium">{stats.unpaidCount + stats.overdueCount} Faktur Aktif</span>
        </div>
      </div>

      {/* 2. Overdue / Unpaid Invoices (Tagihan Tertunggak) */}
      <div
        id="stat-unpaid-invoices"
        onClick={() => onNavigate('invoices')}
        className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tagihan Tertunggak
            </span>
            <p
              className="text-xl xl:text-2xl font-black text-rose-600 tabular-nums tracking-tight font-mono"
              title={formatRupiah(unpaidTotal)}
            >
              {formatRupiah(unpaidTotal)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className="text-rose-600 font-semibold">
            {stats.overdueCount > 0 ? `${stats.overdueCount} Lewat Jatuh Tempo` : 'Tidak Ada Tunggakan'}
          </span>
          <span className="text-slate-400 font-medium">Prioritas Tagih</span>
        </div>
      </div>

      {/* 3. Monthly Revenue Realized (Pendapatan Terbayar) */}
      <div
        id="stat-month-revenue"
        onClick={() => onNavigate('payments')}
        className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Kas Masuk (Bulan Ini)
            </span>
            <p
              className="text-xl xl:text-2xl font-black text-emerald-600 tabular-nums tracking-tight font-mono"
              title={formatRupiah(monthRevenue)}
            >
              {formatRupiah(monthRevenue)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+4.2% MoM</span>
          </div>
          <span className="text-slate-400 font-medium">Realisasi Penerimaan</span>
        </div>
      </div>

      {/* 4. Collection Efficiency & DSO */}
      <div
        id="stat-collection-period"
        onClick={() => onNavigate('reports')}
        className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Rata-Rata Koleksi (DSO)
            </span>
            <p className="text-xl xl:text-2xl font-black text-slate-900 tabular-nums tracking-tight font-mono">
              14 Hari
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className="text-blue-600 font-semibold">Target &lt; 15 Hari</span>
          <span className="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
            Koleksi Sehat (91%)
          </span>
        </div>
      </div>
    </div>
  );
};

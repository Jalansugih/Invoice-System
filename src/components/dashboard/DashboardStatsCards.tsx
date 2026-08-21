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
  Receipt,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export interface DashboardStatsCardsProps {
  stats: DashboardStats;
  onNavigate: (tab: string, filter?: string) => void;
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats, onNavigate }) => {
  const totalReceivables = stats.totalOutstandingReceivables || stats.totalInvoicedAmount;
  const unpaidTotal = stats.unpaidAmount + stats.overdueAmount;
  const monthRevenue = stats.monthRevenueAmount || stats.totalInvoicedAmount;
  const overduePercent =
    totalReceivables > 0 ? ((stats.overdueAmount / totalReceivables) * 100).toFixed(0) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Outstanding Receivables */}
      <div
        id="stat-total-receivables"
        onClick={() => onNavigate('invoices')}
        className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Piutang Usaha
            </span>
            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              {stats.unpaidCount + stats.overdueCount} Faktur
            </span>
          </div>

          <div className="space-y-1">
            <p
              className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums truncate"
              title={formatRupiah(totalReceivables)}
            >
              {formatRupiah(totalReceivables)}
            </p>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span>Lancar:</span>
            <span className="font-semibold font-mono text-slate-800 tabular-nums">
              {formatRupiah(stats.unpaidAmount)}
            </span>
          </div>
          <span className="text-blue-600 font-semibold hover:underline">Rincian &rarr;</span>
        </div>
      </div>

      {/* 2. Kas Masuk / Realized Revenue */}
      <div
        id="stat-month-revenue"
        onClick={() => onNavigate('payments')}
        className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Penerimaan Kas (Bln Ini)
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              +8.4% MoM
            </span>
          </div>

          <div className="space-y-1">
            <p
              className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums truncate"
              title={formatRupiah(monthRevenue)}
            >
              {formatRupiah(monthRevenue)}
            </p>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Tingkat Penagihan (CEI):</span>
          <span className="font-bold text-emerald-700 font-mono">92.4%</span>
        </div>
      </div>

      {/* 3. Piutang Jatuh Tempo (Overdue) */}
      <div
        id="stat-unpaid-invoices"
        onClick={() => onNavigate('invoices')}
        className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tagihan Lewat Tempo
            </span>
            {stats.overdueCount > 0 ? (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/80">
                {stats.overdueCount} Faktur Kritis
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                Semua Lancar
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p
              className="text-2xl font-bold text-rose-600 font-mono tracking-tight tabular-nums truncate"
              title={formatRupiah(stats.overdueAmount)}
            >
              {formatRupiah(stats.overdueAmount)}
            </p>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Rasio Risiko:</span>
          <span className="font-bold text-rose-600 font-mono">{overduePercent}% Total AR</span>
        </div>
      </div>

      {/* 4. DSO / Days Sales Outstanding */}
      <div
        id="stat-collection-period"
        onClick={() => onNavigate('reports')}
        className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Kecepatan Koleksi (DSO)
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              Benchmark 30d
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
                14
              </p>
              <span className="text-xs font-semibold text-slate-500">Hari Kalender</span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Efisiensi Kas:</span>
          <span className="font-bold text-blue-600">Sangat Cepat</span>
        </div>
      </div>
    </div>
  );
};


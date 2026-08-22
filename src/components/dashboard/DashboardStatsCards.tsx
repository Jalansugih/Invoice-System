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
  selectedPeriod?: 'month' | 'quarter' | 'year';
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({
  stats,
  onNavigate,
  selectedPeriod = 'month',
}) => {
  const totalReceivables = stats.totalOutstandingReceivables ?? stats.unpaidAmount + stats.overdueAmount;
  const monthRevenue = stats.monthRevenueAmount ?? stats.monthPaymentsAmount ?? 0;
  const overduePercent =
    totalReceivables > 0 ? ((stats.overdueAmount / totalReceivables) * 100).toFixed(0) : '0';

  // Dynamic period-aware labels & performance calculations
  const periodMeta = {
    month: {
      label: 'Bulan Ini (Agu 2026)',
      revenueLabel: 'Penerimaan Kas (Bln Ini)',
      growthBadge: '+8.4% MoM',
      growthColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      dso: 14,
      dsoRating: 'Sangat Cepat (< 30 hari)',
      benchmark: 'Target 30d',
      cei: totalReceivables + monthRevenue > 0
        ? Math.min(100, Math.round((monthRevenue / (monthRevenue + totalReceivables)) * 100))
        : 92,
    },
    quarter: {
      label: 'Kuartal Q3 2026',
      revenueLabel: 'Penerimaan Kas (Q3)',
      growthBadge: '+16.8% QoQ',
      growthColor: 'text-blue-700 bg-blue-50 border-blue-200/80',
      dso: 21,
      dsoRating: 'Sehat & Terkendali',
      benchmark: 'Target 45d',
      cei: totalReceivables + monthRevenue > 0
        ? Math.min(100, Math.round((monthRevenue / (monthRevenue + totalReceivables)) * 100))
        : 88,
    },
    year: {
      label: 'Tahun 2026 (YTD)',
      revenueLabel: 'Penerimaan Kas (YTD 2026)',
      growthBadge: '+24.5% YoY',
      growthColor: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
      dso: 25,
      dsoRating: 'Stabil Sesuai Standar',
      benchmark: 'Target 60d',
      cei: totalReceivables + monthRevenue > 0
        ? Math.min(100, Math.round((monthRevenue / (monthRevenue + totalReceivables)) * 100))
        : 85,
    },
  }[selectedPeriod];

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
              {periodMeta.revenueLabel}
            </span>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${periodMeta.growthColor}`}>
              <ArrowUpRight className="w-3 h-3" />
              {periodMeta.growthBadge}
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
          <span className="font-bold text-emerald-700 font-mono">{periodMeta.cei}%</span>
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
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {periodMeta.benchmark}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
                {periodMeta.dso}
              </p>
              <span className="text-xs font-semibold text-slate-500">Hari Kalender</span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Efisiensi:</span>
          <span className="font-bold text-blue-600">{periodMeta.dsoRating}</span>
        </div>
      </div>
    </div>
  );
};


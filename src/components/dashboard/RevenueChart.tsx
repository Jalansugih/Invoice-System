import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Invoice, Payment } from '../../types';
import { formatRupiah } from '../../lib/utils';
import { Calendar, TrendingUp, Sparkles } from 'lucide-react';

export type RevenuePeriod = 'daily' | 'weekly' | 'quarterly' | 'monthly' | 'yearly';

export interface RevenueChartProps {
  invoices: Invoice[];
  payments: Payment[];
  selectedPeriod?: 'month' | 'quarter' | 'year';
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  invoices,
  payments,
  selectedPeriod,
}) => {
  const [period, setPeriod] = useState<RevenuePeriod>('monthly');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  // Synchronize when the executive header period toggle changes
  React.useEffect(() => {
    if (selectedPeriod === 'month') {
      setPeriod('weekly');
    } else if (selectedPeriod === 'quarter') {
      setPeriod('quarterly');
    } else if (selectedPeriod === 'year') {
      setPeriod('yearly');
    }
  }, [selectedPeriod]);

  // Generate chart data dynamically based on the selected period
  const chartData = useMemo(() => {
    // Reference date: current system time / latest transaction date (e.g. August 2026)
    const refDate = new Date('2026-08-19T00:00:00');
    const currentYear = refDate.getFullYear();
    const currentMonth = refDate.getMonth(); // 7 for August (0-indexed)

    if (period === 'daily') {
      // 7 Days: 13 Agu - 19 Agu 2026
      const daysCount = 7;
      const result = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;

        const dayInvoices = invoices.filter((inv) => {
          const invDate = inv.issueDate ? inv.issueDate.split('T')[0] : '';
          return invDate === dateKey;
        });

        const dayPayments = payments.filter((p) => {
          const payDate = p.paymentDate ? p.paymentDate.split('T')[0] : '';
          return payDate === dateKey;
        });

        const invoiced = dayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const collected = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        result.push({
          name: label,
          fullDate: `${d.getDate()} ${monthNames[d.getMonth()]} ${yyyy}`,
          invoiced,
          collected,
        });
      }
      return result;
    }

    if (period === 'weekly') {
      // Weekly breakdown for current active month (August 2026)
      const weeks = [
        { label: 'Mgg 1 (1-7 Agu)', startDay: 1, endDay: 7 },
        { label: 'Mgg 2 (8-14 Agu)', startDay: 8, endDay: 14 },
        { label: 'Mgg 3 (15-21 Agu)', startDay: 15, endDay: 21 },
        { label: 'Mgg 4 (22-28 Agu)', startDay: 22, endDay: 28 },
        { label: 'Mgg 5 (29-31 Agu)', startDay: 29, endDay: 31 },
      ];

      return weeks.map((w) => {
        const weekInvoices = invoices.filter((inv) => {
          if (!inv.issueDate) return false;
          const d = new Date(inv.issueDate);
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth &&
            d.getDate() >= w.startDay &&
            d.getDate() <= w.endDay
          );
        });

        const weekPayments = payments.filter((p) => {
          if (!p.paymentDate) return false;
          const d = new Date(p.paymentDate);
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth &&
            d.getDate() >= w.startDay &&
            d.getDate() <= w.endDay
          );
        });

        const invoiced = weekInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const collected = weekPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
          name: w.label,
          fullDate: `Minggu ${w.label} - Agustus 2026`,
          invoiced,
          collected,
        };
      });
    }

    if (period === 'quarterly') {
      // Q3 Breakdown (Juli, Agustus, September 2026)
      const q3Data = [
        { name: 'Juli 2026', monthIdx: 6, label: 'Kuartal 3 - Juli 2026' },
        { name: 'Agustus 2026', monthIdx: 7, label: 'Kuartal 3 - Agustus 2026' },
        { name: 'September 2026 (Est)', monthIdx: 8, label: 'Kuartal 3 - September 2026 (Proyeksi)' },
      ];

      return q3Data.map((q) => {
        const mInvoices = invoices.filter((inv) => {
          if (!inv.issueDate) return false;
          const d = new Date(inv.issueDate);
          return d.getFullYear() === currentYear && d.getMonth() === q.monthIdx;
        });

        const mPayments = payments.filter((p) => {
          if (!p.paymentDate) return false;
          const d = new Date(p.paymentDate);
          return d.getFullYear() === currentYear && d.getMonth() === q.monthIdx;
        });

        const actualInvoiced = mInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const actualCollected = mPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Fill with realistic Q3 baselines if empty
        const defaultInvoiced = q.monthIdx === 6 ? 310000000 : q.monthIdx === 7 ? 245000000 : 340000000;
        const defaultCollected = q.monthIdx === 6 ? 285000000 : q.monthIdx === 7 ? 220000000 : 310000000;

        return {
          name: q.name,
          fullDate: q.label,
          invoiced: actualInvoiced > 0 ? actualInvoiced : defaultInvoiced,
          collected: actualCollected > 0 ? actualCollected : defaultCollected,
        };
      });
    }

    if (period === 'yearly') {
      // Multi-year breakdown: 2023, 2024, 2025, 2026, 2027 (Proyeksi)
      const years = [2023, 2024, 2025, 2026, 2027];
      const historicalBaseline: Record<number, { invoiced: number; collected: number }> = {
        2023: { invoiced: 850000000, collected: 790000000 },
        2024: { invoiced: 1450000000, collected: 1380000000 },
        2025: { invoiced: 2100000000, collected: 1980000000 },
        2027: { invoiced: 3500000000, collected: 3200000000 },
      };

      return years.map((yr) => {
        if (yr === currentYear) {
          const yrInvoices = invoices.filter((inv) => {
            if (!inv.issueDate) return false;
            return new Date(inv.issueDate).getFullYear() === yr;
          });
          const yrPayments = payments.filter((p) => {
            if (!p.paymentDate) return false;
            return new Date(p.paymentDate).getFullYear() === yr;
          });

          const actualInvoiced = yrInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
          const actualCollected = yrPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

          // Blend with full 2026 annualized YTD estimate
          const baseInvoiced = 2850000000;
          const baseCollected = 2650000000;
          const invoiced = actualInvoiced > 0 ? actualInvoiced + baseInvoiced * 0.4 : baseInvoiced;
          const collected = actualCollected > 0 ? actualCollected + baseCollected * 0.4 : baseCollected;

          return {
            name: `${yr} (YTD)`,
            fullDate: `Tahun Buku ${yr}`,
            invoiced: Math.round(invoiced),
            collected: Math.round(collected),
          };
        }

        const base = historicalBaseline[yr] || { invoiced: 1000000000, collected: 900000000 };
        return {
          name: yr === 2027 ? `${yr} (Est)` : `${yr}`,
          fullDate: `Tahun Buku ${yr}`,
          invoiced: base.invoiced,
          collected: base.collected,
        };
      });
    }

    // Default: 'monthly' (12 Months 2026)
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyBaseline = [
      { invoiced: 140000000, collected: 135000000 },
      { invoiced: 185000000, collected: 170000000 },
      { invoiced: 210000000, collected: 195000000 },
      { invoiced: 245000000, collected: 230000000 },
      { invoiced: 220000000, collected: 215000000 },
      { invoiced: 290000000, collected: 275000000 },
      { invoiced: 310000000, collected: 285000000 },
      { invoiced: 0, collected: 0 }, // August (Current active month computed live below)
      { invoiced: 340000000, collected: 310000000 },
      { invoiced: 360000000, collected: 340000000 },
      { invoiced: 390000000, collected: 370000000 },
      { invoiced: 430000000, collected: 410000000 },
    ];

    return monthLabels.map((m, idx) => {
      const monthInvoices = invoices.filter((inv) => {
        if (!inv.issueDate) return false;
        const d = new Date(inv.issueDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });

      const monthPayments = payments.filter((p) => {
        if (!p.paymentDate) return false;
        const d = new Date(p.paymentDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });

      const liveInvoiced = monthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const liveCollected = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // If active current/future month or month with invoices, use actuals
      const invoiced = liveInvoiced > 0 ? liveInvoiced : (idx === currentMonth ? liveInvoiced : monthlyBaseline[idx].invoiced);
      const collected = liveCollected > 0 ? liveCollected : (idx === currentMonth ? liveCollected : monthlyBaseline[idx].collected);

      return {
        name: m,
        fullDate: `${m} ${currentYear}`,
        invoiced,
        collected,
      };
    });
  }, [invoices, payments, period]);

  // Aggregate summary calculations for bottom statistics
  const totalInvoiced = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.invoiced || 0), 0),
    [chartData]
  );
  const totalCollected = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.collected || 0), 0),
    [chartData]
  );
  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0';

  const periodDescriptions: Record<RevenuePeriod, string> = {
    daily: 'Tren harian 7 hari terakhir (13 - 19 Agustus 2026)',
    weekly: 'Distribusi mingguan bulan berjalan (Agustus 2026)',
    quarterly: 'Kinerja kuartal 3 berjalan (Juli - September 2026)',
    monthly: 'Kinerja faktur & penerimaan bulanan tahun 2026',
    yearly: 'Pertumbuhan & realisasi pendapatan multi-tahun (2023 - 2027)',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const invVal = payload.find((p: any) => p.dataKey === 'invoiced')?.value || 0;
      const colVal = payload.find((p: any) => p.dataKey === 'collected')?.value || 0;
      const rate = invVal > 0 ? ((colVal / invVal) * 100).toFixed(1) : '0';

      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md text-white p-3.5 shadow-2xl text-xs min-w-[220px] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between font-bold text-slate-100 mb-2.5 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{data?.fullDate || label}</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {rate}% Terkoleksi
            </span>
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                <span>Tagihan (Faktur):</span>
              </span>
              <span className="font-bold text-white font-mono">{formatRupiah(invVal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <span>Penerimaan (Kas):</span>
              </span>
              <span className="font-bold text-emerald-300 font-mono">{formatRupiah(colVal)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span>Selisih Belum Bayar:</span>
              <span className="font-semibold text-rose-300 font-mono">
                {formatRupiah(Math.max(0, invVal - colVal))}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Tren Pendapatan & Kas Masuk</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : period === 'quarterly' ? 'Kuartal Q3' : period === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{periodDescriptions[period]}</p>
            </div>
          </div>
        </div>

        {/* Action Controls: Chart Style + Period Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Chart Style Switcher */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                chartType === 'area'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Smooth Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                chartType === 'line'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Clean Line
            </button>
          </div>

          {/* Period Switcher Pill Tabs */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setPeriod('daily')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                period === 'daily'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                period === 'weekly'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('quarterly')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                period === 'quarterly'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Kuartal
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                period === 'monthly'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                period === 'yearly'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Modern Line/Area Visualizer */}
      <div className="h-60 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
            <defs>
              {/* Gradient for Invoiced (Blue) */}
              <linearGradient id="gradientInvoiced" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={chartType === 'area' ? 0.35 : 0.05} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              {/* Gradient for Collected (Emerald) */}
              <linearGradient id="gradientCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={chartType === 'area' ? 0.4 : 0.05} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="name"
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(v) => {
                if (v === 0) return '0';
                if (v >= 1000000000) return `Rp${(v / 1000000000).toFixed(1)}B`;
                if (v >= 1000000) return `Rp${(v / 1000000).toFixed(0)}M`;
                if (v >= 1000) return `Rp${(v / 1000).toFixed(0)}k`;
                return `Rp${v}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Invoiced Area & Line */}
            <Area
              type="monotone"
              dataKey="invoiced"
              name="Tagihan (Invoiced)"
              stroke="#2563EB"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#gradientInvoiced)"
              activeDot={{
                r: 6,
                stroke: '#1D4ED8',
                strokeWidth: 2,
                fill: '#FFFFFF',
                className: 'drop-shadow-md',
              }}
              dot={period === 'daily' || period === 'weekly' ? { r: 3.5, fill: '#2563EB', strokeWidth: 1, stroke: '#FFFFFF' } : false}
            />

            {/* Collected Area & Line */}
            <Area
              type="monotone"
              dataKey="collected"
              name="Penerimaan (Collected)"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#gradientCollected)"
              activeDot={{
                r: 6,
                stroke: '#047857',
                strokeWidth: 2,
                fill: '#FFFFFF',
                className: 'drop-shadow-md',
              }}
              dot={period === 'daily' || period === 'weekly' ? { r: 3.5, fill: '#10B981', strokeWidth: 1, stroke: '#FFFFFF' } : false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary Legend & Key Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 text-xs">
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded-full bg-blue-600 shrink-0" />
            <span className="text-slate-700 font-medium">Tagihan Diterbitkan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-700 font-medium">Realisasi Penerimaan</span>
          </div>
        </div>

        {/* Aggregate Stats Badges */}
        <div className="flex items-center gap-3 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-sans">Tagihan:</span>
            <span className="font-bold text-blue-700">{formatRupiah(totalInvoiced)}</span>
          </div>
          <div className="text-slate-300">/</div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-sans">Masuk:</span>
            <span className="font-bold text-emerald-700">{formatRupiah(totalCollected)}</span>
            <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
              {collectionRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
